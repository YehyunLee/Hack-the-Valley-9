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

    // Fixed GET request for leaderboard
    if (req.method === 'GET') {
        try {
            const users = await prisma.user.findMany({
                select: {
                    id: true,
                    name: true,
                    score: true
                },
                orderBy: {
                    score: 'desc'
                },
                take: 10  // Limit the number of users returned to top 10 for the leaderboard
            });

            return res.status(200).json({ leaderboard: users }); // Clear response structure

        } catch (error) {
            console.error(error); // Log the error for debugging
            return res.status(500).json({ error: 'Error fetching leaderboard' });
        }
    }

    else {
        return res.status(200).json({ message: 'Error' });
    }
}