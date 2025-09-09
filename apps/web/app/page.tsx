'use client';
import Link from 'next/link';
export default function Page(){
  return (<div style={{padding:12}}>
    <h1 style={{fontSize:26,fontWeight:800}}>one-not</h1>
    <p>Mobile-ready dating starter app. <Link href="/map">Map</Link> · <Link href="/home">Discover</Link></p>
  </div>);
}
