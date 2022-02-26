import Head from "next/head";
import styles from "../styles/pages/Home.module.css";
import Layout from "../Components/Layout";

// * Landing Home Page

function Home() {
	return (
		<Layout currentPage="public">
			<Head>
				<title>Next Plate</title>
				{/* <link rel="icon" href="/favicon.ico" /> */}
			</Head>

			<main className={styles.main}>
				<h1>garwing lai</h1>
			</main>

			<footer className={styles.footer}>
				<h2>footer</h2>
			</footer>
		</Layout>
	);
}

export default Home;
