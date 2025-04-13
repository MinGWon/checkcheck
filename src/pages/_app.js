import '@/styles/globals.css' // If you already have global styles
import '@/styles/print.css' // Add the print styles globally

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />
}

export default MyApp
