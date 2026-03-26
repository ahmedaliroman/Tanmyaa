
import ee from '@google/earthengine';
import { Router } from 'express';

const router = Router();

// Lazy initialize GEE
let isGeeInitialized = false;

const initializeGee = async () => {
    if (isGeeInitialized) return;

    const serviceAccount = process.env.GEE_SERVICE_ACCOUNT;
    const privateKey = process.env.GEE_PRIVATE_KEY;

    if (!serviceAccount || !privateKey) {
        throw new Error('Google Earth Engine credentials are not configured.');
    }

    return new Promise<void>((resolve, reject) => {
        ee.data.authenticateViaServiceAccount(
            serviceAccount,
            privateKey,
            () => {
                ee.initialize(
                    null,
                    null,
                    () => {
                        isGeeInitialized = true;
                        console.log('Google Earth Engine initialized successfully.');
                        resolve();
                    },
                    (err: Error) => {
                        console.error('GEE initialization failed:', err);
                        reject(err);
                    }
                );
            },
            (err: Error) => {
                console.error('GEE authentication failed:', err);
                reject(err);
            }
        );
    });
};

router.post('/analyze', async (req, res) => {
    try {
        await initializeGee();
        
        const { bounds, analysisType } = req.body;
        
        // Example GEE analysis: NDVI for a given area
        // This is a placeholder for actual GEE logic
        // In a real app, you'd define specific scripts for different analysis types
        
        if (analysisType === 'vegetation') {
            const geometry = ee.Geometry.Rectangle([
                bounds.west, bounds.south, bounds.east, bounds.north
            ]);
            
            const collection = ee.ImageCollection('COPERNICUS/S2_SR')
                .filterBounds(geometry)
                .filterDate('2023-01-01', '2023-12-31')
                .sort('CLOUDY_PIXEL_PERCENTAGE')
                .first();
            
            const ndvi = collection.normalizedDifference(['B8', 'B4']).rename('NDVI');
            
            const mapId = await new Promise((resolve, reject) => {
                ndvi.getMap({ min: 0, max: 1, palette: ['red', 'yellow', 'green'] }, (data: { mapid: string }, err: Error) => {
                    if (err) reject(err);
                    else resolve(data);
                });
            });
            
            return res.json({ success: true, mapId });
        }

        res.status(400).json({ error: 'Unsupported analysis type.' });
    } catch (error: unknown) {
        console.error('GEE Analysis Error:', error);
        res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to perform GEE analysis.' });
    }
});

export default router;
