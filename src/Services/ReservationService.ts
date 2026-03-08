import axios from 'axios';

const postReservation = async (reservationData: any) => {
  try {
    const response = await axios.post('http://127.0.0.1:8000/api/reservations/', reservationData);
    return response;
  } catch (error) {
    // Check if error response exists and contains data
    if (error.response && error.response.data) {
      console.error("API Error Response:", error.response.data);
      throw new Error(error.response.data.detail || "An error occurred while submitting the reservation.");
    } else {
      console.error("API Error:", error.message);
      throw new Error("An error occurred while submitting the reservation.");
    }
  }
};

export { postReservation };
