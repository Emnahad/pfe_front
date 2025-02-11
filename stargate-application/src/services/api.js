import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000/workflows"; // Your FastAPI backend

export const fetchWorkflows = async () => {
    try {
        const response = await axios.get(API_BASE_URL);
        return response.data;
    } catch (error) {
        console.error("Error fetching workflows:", error);
        return [];
    }
};

export const createWorkflow = async (workflow) => {
    try {
        const response = await axios.post(API_BASE_URL, workflow);
        return response.data;
    } catch (error) {
        console.error("Error creating workflow:", error);
        return null;
    }
};

export const updateWorkflow = async (id, workflow) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/${id}`, workflow);
        return response.data;
    } catch (error) {
        console.error("Error updating workflow:", error);
        return null;
    }
};

export const deleteWorkflow = async (id) => {
    try {
        await axios.delete(`${API_BASE_URL}/${id}`);
        return true;
    } catch (error) {
        console.error("Error deleting workflow:", error);
        return false;
    }
};
