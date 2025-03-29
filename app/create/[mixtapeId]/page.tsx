export default async function Page({
    params,
  }: {
    params: Promise<{ mixtapeId: string }>
  }) {
    const { mixtapeId } = await params
    return (<div>My Mixtape: {mixtapeId}</div>);
  }