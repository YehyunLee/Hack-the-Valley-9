import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: any, res: any) {
    if (req.headers['content-type'] !== 'application/json') {
        return res.status(400).json({ error: 'Invalid content-type. Please use application/json' });
    }

    if (req.method === 'POST' && req.body.task === 'scoreIncrement') {
        const { id } = req.body;
        try {
            await prisma.user.update({
                where: { id: id },
                data: {
                    score: {
                        increment: 1
                    }
                }
            });
            return res.status(200).json({ success: true });
        } catch (error) {
            return res.status(500).json({ error: 'Error incrementing score' });
        }
    }
    
    // leaderboard
    if (req.method === 'GET' && req.body.task === 'leaderboard') {
        try {
            const users = await prisma.user.findMany({
                select: {
                    id: true,
                    name: true,
                    score: true
                },
                orderBy: {
                    score: 'desc'
                }
            });
            return res.status(200).json({ users });
            // will this contain score, name? A. Yes
        } catch (error) {
            return res.status(500).json({ error: 'Error fetching leaderboard' });
        }
    }
    
    
    
    
    else {
        return res.status(200).json({ message: 'Error' });
    }
}