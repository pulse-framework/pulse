import React from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';
import Pulse from 'pulse-framework';
import { preserveServerState } from 'pulse-framework/next';

const App = new Pulse().with(React);

const core = App.Core({
  accounts: App.Controller({
    state: { MY_STATE: App.State(1) }
  })
});

const IndexPage = props => {
  return (
    <Layout title="Home | Next.js + TypeScript Example">
      <h1>Hello Next.js 👋</h1>
      <p>
        <Link href="/about">
          <a>About</a>
        </Link>
      </p>
    </Layout>
  );
};

export default IndexPage;

export async function getServerSideProps() {
  const data = { props: {} };

  core.accounts.state.MY_STATE.set(2);

  return preserveServerState(data, core);
}
