function getDeviceId() {
    const cookieName = import.meta.env.VITE_GA_COOKIE; // cookie from Google Analytics Ordotype Container
    const cookies = document.cookie.split("; ");

    for (const cookie of cookies) {
        const [name, value] = cookie.split("=");
        if (name === cookieName) {
            return value;
        }
    }

    throw new Error("Device Id cookie not found");
}

export { getDeviceId };