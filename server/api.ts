import { Router } from 'express';
import { 
    generateImage, 
    generatePresentation, 
    refinePresentation, 
    generatePolicyReport, 
    generateRFP, 
    generateCapacityBuildingProgram, 
    generateVisionFramework, 
    generateStakeholderPlan, 
    generateMethodology,
    getChallengeSuggestions,
    getScaleSuggestions
} from './gemini.ts';

const router = Router();

router.post('/generate-image', async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required.' });
        }
        const imageUrl = await generateImage(prompt);
        res.json({ imageUrl });
    } catch (error) {
        console.error('Failed to generate image:', error);
        res.status(500).json({ error: 'Failed to generate image.' });
    }
});

router.post('/generate-presentation', async (req, res) => {
    try {
        const { projectInfo, files, companyProfile } = req.body;
        if (!projectInfo) {
            return res.status(400).json({ error: 'Project info is required.' });
        }
        const presentation = await generatePresentation(projectInfo, files || [], companyProfile);
        res.json({ presentation });
    } catch (error) {
        console.error('Failed to generate presentation:', error);
        res.status(500).json({ error: 'Failed to generate presentation.' });
    }
});

router.post('/refine-presentation', async (req, res) => {
    try {
        const { currentSlides, userRequest, activeSlideIndex } = req.body;
        if (!currentSlides || !userRequest || activeSlideIndex === undefined) {
            return res.status(400).json({ error: 'Missing required parameters.' });
        }
        const presentation = await refinePresentation(currentSlides, userRequest, activeSlideIndex);
        res.json({ presentation });
    } catch (error) {
        console.error('Failed to refine presentation:', error);
        res.status(500).json({ error: 'Failed to refine presentation.' });
    }
});

router.post('/generate-policy-report', async (req, res) => {
    try {
        const { brief, files, companyProfile } = req.body;
        if (!brief) {
            return res.status(400).json({ error: 'Brief is required.' });
        }
        const report = await generatePolicyReport(brief, files || [], companyProfile);
        res.json({ report });
    } catch (error) {
        console.error('Failed to generate policy report:', error);
        res.status(500).json({ error: 'Failed to generate policy report.' });
    }
});

router.post('/generate-rfp', async (req, res) => {
    try {
        const { taskDescription, pageRange, files } = req.body;
        if (!taskDescription || !pageRange) {
            return res.status(400).json({ error: 'Task description and page range are required.' });
        }
        const rfp = await generateRFP(taskDescription, pageRange, files || []);
        res.json({ rfp });
    } catch (error) {
        console.error('Failed to generate RFP:', error);
        res.status(500).json({ error: 'Failed to generate RFP.' });
    }
});

router.post('/generate-capacity-building-program', async (req, res) => {
    try {
        const { audience } = req.body;
        if (!audience) {
            return res.status(400).json({ error: 'Audience is required.' });
        }
        const program = await generateCapacityBuildingProgram(audience);
        res.json({ program });
    } catch (error) {
        console.error('Failed to generate capacity building program:', error);
        res.status(500).json({ error: 'Failed to generate capacity building program.' });
    }
});

router.post('/generate-vision-framework', async (req, res) => {
    try {
        const { city, aspirations, timeframe, companyProfile } = req.body;
        if (!city || !aspirations || !timeframe) {
            return res.status(400).json({ error: 'City, aspirations, and timeframe are required.' });
        }
        const framework = await generateVisionFramework(city, aspirations, timeframe, companyProfile);
        res.json({ framework });
    } catch (error) {
        console.error('Failed to generate vision framework:', error);
        res.status(500).json({ error: 'Failed to generate vision framework.' });
    }
});

router.post('/generate-stakeholder-plan', async (req, res) => {
    try {
        const { context, goals, companyProfile } = req.body;
        if (!context || !goals) {
            return res.status(400).json({ error: 'Context and goals are required.' });
        }
        const plan = await generateStakeholderPlan(context, goals, companyProfile);
        res.json({ plan });
    } catch (error) {
        console.error('Failed to generate stakeholder plan:', error);
        res.status(500).json({ error: 'Failed to generate stakeholder plan.' });
    }
});

router.post('/generate-methodology', async (req, res) => {
    try {
        const { task, companyProfile } = req.body;
        if (!task) {
            return res.status(400).json({ error: 'Task is required.' });
        }
        const methodology = await generateMethodology(task, companyProfile);
        res.json({ methodology });
    } catch (error) {
        console.error('Failed to generate methodology:', error);
        res.status(500).json({ error: 'Failed to generate methodology.' });
    }
});

router.post('/get-challenge-suggestions', async (req, res) => {
    try {
        const { location, scale } = req.body;
        if (!location || !scale) {
            return res.status(400).json({ error: 'Location and scale are required.' });
        }
        const suggestions = await getChallengeSuggestions(location, scale);
        res.json({ suggestions });
    } catch (error) {
        console.error('Failed to get challenge suggestions:', error);
        res.status(500).json({ error: 'Failed to get challenge suggestions.' });
    }
});

router.post('/get-scale-suggestions', async (req, res) => {
    try {
        const { location } = req.body;
        if (!location) {
            return res.status(400).json({ error: 'Location is required.' });
        }
        const suggestions = await getScaleSuggestions(location);
        res.json({ suggestions });
    } catch (error) {
        console.error('Failed to get scale suggestions:', error);
        res.status(500).json({ error: 'Failed to get scale suggestions.' });
    }
});

export default router;
