import React, { useEffect, useState } from 'react'
import api, { getLocations, addLocation, deleteLocation } from '../api'

export default function AdminLocations(){
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [lng, setLng] = useState('')
  const [lat, setLat] = useState('')

  useEffect(()=>{ loadLocations() }, [])

  const loadLocations = async ()=>{
    setLoading(true)
    try{
      const res = await getLocations()
      setLocations(res?.data?.data || [])
    }catch(e){ console.error(e); setLocations([]) }
    finally{ setLoading(false) }
  }

  const handleAdd = async ()=>{
    if(!name || !lng || !lat) return alert('Please provide name, longitude and latitude')
    try{
      await addLocation({ name, longitude: Number(lng), latitude: Number(lat) })
      alert('Location added')
      setName(''); setLng(''); setLat('')
      loadLocations()
    }catch(e){ alert(e?.response?.data?.message || 'Failed to add location') }
  }

  const handleDelete = async (locId)=>{
    if(!locId) return
    if(!confirm('Delete location?')) return
    try{
      await deleteLocation(locId)
      alert('Location deleted')
      loadLocations()
    }catch(e){ alert(e?.response?.data?.message || 'Failed to delete location') }
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Manage Locations</h3>
      <div className="mb-3 p-3 border rounded">
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Location name" className="border p-1 mr-2" />
        <input value={lng} onChange={e=>setLng(e.target.value)} placeholder="Longitude" className="border p-1 mr-2" />
        <input value={lat} onChange={e=>setLat(e.target.value)} placeholder="Latitude" className="border p-1 mr-2" />
        <button onClick={handleAdd} className="bg-blue-600 text-white px-2 py-1">Add Location</button>
      </div>

      <div className="mb-3">
        {loading ? <div>Loading...</div> : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {locations.length===0 && <div className="text-gray-600">No locations found</div>}
            {locations.map(l => (
              <div key={l._id} className="border p-2 rounded flex justify-between items-center">
                <div>{l.name}</div>
                <button onClick={()=>handleDelete(l._id)} className="bg-red-600 text-white px-2 py-1">Delete</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
