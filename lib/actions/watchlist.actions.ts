"use server";

import { connectToDatabase } from "@/database/mongoose";
import Watchlist from "@/database/models/watchlist.model";

export async function getWatchlistSymbolsByEmail(email: string): Promise<string[]> {
  if (!email) return [];
  try {
    await connectToDatabase();
    
    // Find user by email (Better Auth stores users in 'user' collection)
    const { connection } = await connectToDatabase();

    if (!connection) throw new Error('Database connection not established');

    const userCollection = connection.collection('Watchlist');
    const user = await userCollection.findOne({ email });

    if (!user) {
      return [];
    }
    
    // Query watchlist by userId and return just the symbols

    const userId = (user.id as string) || String(user._id || '');
    const watchlistItems = await Watchlist.find(
      { userId },
      { symbol: 1, _id: 0 }
      ).lean();

    return watchlistItems.map(item => String(item.symbol));
  } catch (error) {
    console.error('Error fetching watchlist symbols:', error);
    return [];
  }
}