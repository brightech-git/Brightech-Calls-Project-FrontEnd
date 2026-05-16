const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const registerUser = async (data: {
    userId: string;
    username: string;
    password: string;
}) => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    const result = await res.json();

    if (!res.ok) {
        throw result;
    }

    return result;
};

export const loginUser = async (data: {
    loginId: string;
    password: string;
}) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    const result = await res.json();

    if (!res.ok) {
        throw result;
    }

    return result;
};