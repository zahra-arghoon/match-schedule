import app from './app';
import { config } from 'dotenv';

// Load environment variables
config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});