'use client';
import { useLoadScript, GoogleMap, Marker } from '@react-google-maps/api';
import { useEffect, useState } from 'react';
import axios from 'axios';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
export default function MapPage(){
  const { isLoaded } = useLoadScript({ googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '' });
  const [pos, setPos] = useState(null); const [users, setUsers] = useState([]);
  useEffect(()=>{ if(navigator.geolocation){ navigator.geolocation.getCurrentPosition(p=>{ setPos({lat:p.coords.latitude,lng:p.coords.longitude}); fetchNearby(p.coords.latitude,p.coords.longitude); }); } },[]);
  async function fetchNearby(lat,lng){ try{ const r = await axios.get(`${API}/profile/discover?lat=${lat}&lng=${lng}&km=50`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')||''}` } }); setUsers(r.data); }catch(e){ console.error(e); } }
  if(!isLoaded) return <div>Loading map...</div>;
  return (<div style={{padding:12}}>
    <h2 style={{fontSize:20,fontWeight:700}}>Nearby on Map</h2>
    <div style={{width:'100%',height:520}}>
      <GoogleMap center={pos||{lat:-26.2041,lng:28.0473}} zoom={12} mapContainerStyle={{width:'100%',height:'100%'}}>
        {pos && <Marker position={pos} label="You" />}
        {users.map(u=>(<Marker key={u.id} position={{lat:u.latitude,lng:u.longitude}} label={u.displayName} />))}
      </GoogleMap>
    </div>
  </div>);
}
