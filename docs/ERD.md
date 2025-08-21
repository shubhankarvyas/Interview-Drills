# Entity Relationship Diagram (ERD)

## Database Collections

### Users Collection
```
users {
  _id: ObjectId [Primary Key]
  email: String [Unique Index] 
  name: String
  picture: String (URL)
  providers: Array<String> (e.g., ['google', 'linkedin'])
  createdAt: Date
}
```

### Drills Collection
```
drills {
  _id: ObjectId [Primary Key]
  title: String
  difficulty: String [Index] (Easy/Medium/Hard)
  tags: Array<String> [Index]
  questions: Array<Object> {
    text: String
    keywords: Array<String> (for scoring)
  }
  createdAt: Date
}
```

### Attempts Collection
```
attempts {
  _id: ObjectId [Primary Key]
  userId: ObjectId [Composite Index with createdAt]
  drillId: ObjectId [References drills._id]
  answers: Array<String> (user's text answers)
  score: Number (0-100, calculated from keyword matching)
  timeSpent: Number (seconds)
  createdAt: Date [Composite Index with userId]
}
```

## Relationships

1. **Users → Attempts** (One-to-Many)
   - One user can have multiple attempts
   - attempts.userId references users._id

2. **Drills → Attempts** (One-to-Many)
   - One drill can have multiple attempts by different users
   - attempts.drillId references drills._id

3. **No direct Users → Drills relationship**
   - Drills are public and accessible to all authenticated users

## Indexes

### Performance Indexes
- `users.email` (Unique) - for OAuth authentication lookups
- `attempts.userId + attempts.createdAt` (Composite) - for user history queries
- `drills.tags` - for drill filtering by categories
- `drills.difficulty` - for drill filtering by difficulty

### Query Patterns
1. **User login**: `users.email` lookup
2. **User history**: `attempts.userId` + sort by `createdAt` DESC
3. **Drill browsing**: `drills.tags` and `drills.difficulty` filtering
4. **Attempt creation**: Insert into `attempts` with userId and drillId references

## Data Flow
```
User Authentication → Users Collection (create/find by email)
Drill Browsing → Drills Collection (public access)
Taking Drill → Attempts Collection (create with userId + drillId)
View History → Attempts Collection (query by userId, populate drillId)
```
