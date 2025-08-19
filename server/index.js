const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/Ogrodzenie/');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Kost-Bet Fence Configurator API' });
});

// Get available fence systems
app.get('/api/systems', (req, res) => {
  const systems = [
    {
      id: 'smooth-medium',
      name: 'Ogrodzenie gładkie Medium',
      objFile: '/Ogrodzenie/Ogrodzenei gładkie Medium - konfigurator.obj',
      mtlFile: '/Ogrodzenie/Ogrodzenei gładkie Medium - konfigurator.mtl',
      textureFile: '/Ogrodzenie/_1.tif',
      basePrice: 150
    },
    {
      id: 'smooth-premium',
      name: 'Ogrodzenie gładkie Premium',
      objFile: '/Ogrodzenie/smooth-premium.obj',
      mtlFile: '/Ogrodzenie/smooth-premium.mtl',
      textureFile: '/Ogrodzenie/smooth-premium.tif',
      basePrice: 200
    },
    {
      id: 'decorative-classic',
      name: 'Ogrodzenie dekoracyjne Klasyczne',
      objFile: '/Ogrodzenie/decorative-classic.obj',
      mtlFile: '/Ogrodzenie/decorative-classic.mtl',
      textureFile: '/Ogrodzenie/decorative-classic.tif',
      basePrice: 250
    }
  ];
  
  res.json(systems);
});

// Get available house styles
app.get('/api/house-styles', (req, res) => {
  const styles = [
    {
      id: 'modern',
      name: 'Nowoczesny',
      model: '/models/house-modern.glb'
    },
    {
      id: 'classic',
      name: 'Klasyczny',
      model: '/models/house-classic.glb'
    }
  ];
  
  res.json(styles);
});

// Upload new fence system files
app.post('/api/upload-system', upload.fields([
  { name: 'objFile', maxCount: 1 },
  { name: 'mtlFile', maxCount: 1 },
  { name: 'textureFile', maxCount: 1 }
]), (req, res) => {
  try {
    const files = req.files;
    const { name, basePrice } = req.body;
    
    if (!files.objFile || !files.mtlFile) {
      return res.status(400).json({ error: 'OBJ and MTL files are required' });
    }
    
    const system = {
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      objFile: `/Ogrodzenie/${files.objFile[0].filename}`,
      mtlFile: `/Ogrodzenie/${files.mtlFile[0].filename}`,
      textureFile: files.textureFile ? `/Ogrodzenie/${files.textureFile[0].filename}` : null,
      basePrice: parseFloat(basePrice) || 150
    };
    
    res.json({ 
      message: 'System uploaded successfully', 
      system 
    });
  } catch (error) {
    res.status(500).json({ error: 'Upload failed', details: error.message });
  }
});

// Export project to PDF (placeholder)
app.post('/api/export-pdf', (req, res) => {
  try {
    const { projectData } = req.body;
    
    // Here you would implement actual PDF generation
    // For now, just return success
    res.json({ 
      message: 'PDF export initiated',
      downloadUrl: '/exports/fence-project.pdf'
    });
  } catch (error) {
    res.status(500).json({ error: 'Export failed', details: error.message });
  }
});

// Convert TIF to PNG endpoint
app.get('/api/convert-tif/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const tifPath = path.join(__dirname, '../public/Ogrodzenie', filename);
    const pngFilename = filename.replace('.tif', '.png');
    const pngPath = path.join(__dirname, '../public/Ogrodzenie', pngFilename);
    
    // Check if TIF file exists
    if (!fs.existsSync(tifPath)) {
      return res.status(404).json({ error: 'TIF file not found' });
    }
    
    // Check if PNG already exists
    if (fs.existsSync(pngPath)) {
      console.log(`✅ PNG already exists: ${pngFilename}`);
      return res.json({ 
        message: 'PNG already exists',
        pngUrl: `/Ogrodzenie/${pngFilename}`,
        filename: pngFilename
      });
    }
    
    // Convert TIF to PNG using sharp
    console.log(`🔄 Converting TIF to PNG: ${filename} -> ${pngFilename}`);
    
    await sharp(tifPath)
      .png({ quality: 90 })
      .toFile(pngPath);
    
    console.log(`✅ Conversion successful: ${pngFilename}`);
    
    res.json({ 
      message: 'TIF converted to PNG successfully',
      pngUrl: `/Ogrodzenie/${pngFilename}`,
      filename: pngFilename
    });
    
  } catch (error) {
    console.error('❌ Error converting TIF to PNG:', error);
    res.status(500).json({ 
      error: 'TIF conversion failed', 
      details: error.message 
    });
  }
});

// Get texture info endpoint
app.get('/api/texture-info/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const tifPath = path.join(__dirname, '../public/Ogrodzenie', filename);
    const pngFilename = filename.replace('.tif', '.png');
    const pngPath = path.join(__dirname, '../public/Ogrodzenie', pngFilename);
    
    const info = {
      tifExists: fs.existsSync(tifPath),
      pngExists: fs.existsSync(pngPath),
      tifPath: tifPath,
      pngPath: pngPath,
      tifUrl: `/Ogrodzenie/${filename}`,
      pngUrl: `/Ogrodzenie/${pngFilename}`,
      canConvert: fs.existsSync(tifPath) && !fs.existsSync(pngPath)
    };
    
    res.json(info);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get texture info', details: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Kost-Bet Fence Configurator API running on port ${PORT}`);
  console.log(`📁 Static files served from: ${path.join(__dirname, '../public')}`);
  console.log(`🌐 API available at: http://localhost:${PORT}/api`);
});
