import {AuthService} from "./http";
const authService = new AuthService();

export function isMemberLoggedIn() {
    const memberToken = localStorage.getItem("_ms-mid");
    return !!memberToken;
}

export function navigateTo(url: string) {
    window.$memberstackDom._showLoader()
    setTimeout(() => {
        window.location.href = url;
    }, 500)
}


export function pollLocalStorage(key: string, interval = 1000, timeout = 60000) {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
        // Polling function to check if the key exists
        const poll = () => {
            // Check if the desired key exists in localStorage
            if (localStorage.getItem(key)) {
                resolve(`Key "${key}" found in localStorage.`);
                return;
            }

            // Check if the timeout has been exceeded
            if (Date.now() - startTime >= timeout) {
                reject(new Error(`Polling timed out. Key "${key}" not found in localStorage.`));
                return;
            }

            // Continue polling after the specified interval
            setTimeout(poll, interval);
        };

        // Start polling
        poll();
    });
}

export function handleLocalStoragePolling(key: string, interval: number, timeout: number) {

    pollLocalStorage(key, interval, timeout)
        .then((message) => {
            console.debug(`[pollLocalStorage] Success: ${message}`);
            const token = localStorage.getItem(key)!;
            return authService.signup({token})
        })
        .catch((error) => {
            console.error(`[pollLocalStorage] Error: ${error}`);
        });
}
