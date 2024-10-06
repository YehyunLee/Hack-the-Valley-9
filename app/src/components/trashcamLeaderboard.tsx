import React, { useState, useEffect } from 'react';

const TrashcamLeaderboard: React.FC = () => {
    const [leaderboardData, setLeaderboardData] = useState<any[]>([]);

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
                setLeaderboardData(data.leaderboard);
            } catch (error) {
                console.error('Error fetching leaderboard:', error);
            }
        };

        fetchLeaderboardData();
    }, []);

    return (
        <div className="w-full max-w-3xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
            {/* <div className="px-4 py-5 sm:px-6"> */}
                {/* <h2 className="text-2xl font-bold text-center text-gray-900">Leaderboard</h2> */}
            {/* </div> */}
            <div className="px-4 py-5 sm:p-6">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                                    Rank
                                </th>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/2">
                                    Username
                                </th>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                                    Score
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {leaderboardData.map((user: any, index: number) => (
                                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-900">
                                        {index + 1}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                                        {user.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                                        {user.score}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TrashcamLeaderboard;