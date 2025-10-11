'use server';

import { connectToDatabase } from "../../database/mongoose";

export const getAllUsersForNewsEmail = async () => {
  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    console.log(db);
    if (!db) throw new Error('Database connection not established');
    
    const users = await db.collection('user').find(
      { email: { $exists: true, $ne: null } },
      { projection: { id: 1, email: 1, name: 1, country: 1 } }
    ).toArray();
    
    console.log(users);
    return users
    .filter(user => user.email && user.name)
    .map(user => ({
      id: user.id || user._id.toString() || '',
      email: user.email,
      name: user.name,
    }));
  } catch (error) {
    console.error('Error fetching users for news email:', error);
    return [];
  }
}