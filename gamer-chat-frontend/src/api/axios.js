import axios from 'axios';

export default axios.create({
  baseURL: 'http://localhost:5000',
  withCredentials: true, // use this if your backend sends cookies
});
