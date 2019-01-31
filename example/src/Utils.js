export const Log = text => {
    const env = process.env.NODE_ENV
    if (env === "development") {
        // eslint-disable-next-line no-console
        console.log(`[NotifyX] - ${text}`)
    }
}