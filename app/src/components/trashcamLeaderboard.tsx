/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import React, { useState, useEffect } from 'react';

const TrashcamLeaderboard: React.FC = () => {
    const [leaderboardData, setLeaderboardData] = useState<any[]>([]); // Store leaderboard data

    useEffect(() => {
        const fetchLeaderboardData = async () => {
            try {
                const response = await fetch('/api/db', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                if (!response.ok) {
                    throw new Error('Error fetching leaderboard');
                }

                const data = await response.json();
                setLeaderboardData(data.leaderboard); // Set the leaderboard data
            } catch (error) {
                console.error('Error fetching leaderboard:', error);
            }
        };

        fetchLeaderboardData();
    }, []);

    return (
        <>
            <table className='text-center bg-white mr-auto ml-auto w-[40vw] table-fixed border border-separate border-slate-500 text-xl rounded-xl'>
                <thead>
                    <tr>
                        <th className='border-b-2 border-slate-500'>Rank</th>
                        <th className='border-b-2 border-slate-500'>Username</th>
                        <th className='border-b-2 border-slate-500'>Score</th>
                    </tr>
                </thead>
                <tbody>
                    {leaderboardData.length > 0 && leaderboardData.map((user: any, index: number) => (
                        <tr key={index}>
                            <td>{index + 1}</td> {/* Rank starts at 1 */}
                            <td>{user.name}</td>  {/* Display the username */}
                            <td>{user.score}</td> {/* Display the score */}
                        </tr>
                    ))}
                </tbody>
            </table>
        </>
    );
};

export default TrashcamLeaderboard;
