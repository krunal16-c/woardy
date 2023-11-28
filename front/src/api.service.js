const baseUrl = import.meta.env.VITE_API_URL;

export async function fetchPosts() {
    const {dbName,dbUser,dbPassword} = JSON.parse(localStorage.getItem('database'))
    try {
        const response = await fetch(`${baseUrl}/api/db/${dbName}/${dbUser}/${dbPassword}`);
        return await response.json();
    } catch (error) {
        console.error("Error fetching posts:", error);
    }
}

export async function createPost(postData) {
    const {dbName,dbUser,dbPassword} = JSON.parse(localStorage.getItem('database'))
    try {
        const response = await fetch(`${baseUrl}/api/db/create`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({...postData,dbName,dbUser,dbPassword}),
        });
        return await response.json();
    } catch (error) {
        console.error("Error creating post:", error);
    }
}

export async function createDB() {
    try {
        const response = await fetch(`${baseUrl}/api/db`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({dbUser:"root",dbPassword:"root",dbName:"test_mysql"}),
        });
        return await response.json();
    } catch (error) {
        console.error("Error creating post:", error);
    }
}