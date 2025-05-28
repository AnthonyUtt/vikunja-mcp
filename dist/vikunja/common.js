import axios from 'axios';
const baseURL = `${process.env.VIKUNJA_API_BASE}/api/v1`;
const headers = {
    Authorization: `Bearer ${process.env.VIKUNJA_API_TOKEN}`,
    'Content-Type': 'application/json',
};
export const serviceInstance = axios.create({
    baseURL,
    headers,
});
export const wrapRequest = async (request) => {
    try {
        const response = await request;
        return {
            data: response.data,
            isError: false,
        };
    }
    catch (error) {
        const errorMessage = axios.isAxiosError(error)
            ? error.response?.data?.message || error.message
            : `Unexpected error: ${error}`;
        return {
            isError: true,
            error: errorMessage,
        };
    }
};
