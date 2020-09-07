import Link from 'next/link';
import Layout from '../components/Layout';
import Pulse from 'pulse-framework';

const App = new Pulse();

console.log(App);

const IndexPage = () => (
  <Layout title="Home | Next.js + TypeScript Example">
    <h1>Hello Next.js 👋</h1>
    <p>
      <Link href="/about">
        <a>About</a>
      </Link>
    </p>
  </Layout>
);

export default IndexPage;
