import React, { useEffect, useState } from 'react'
import api, { getLocations, addLocation, deleteLocation } from '../api'
import Modal from '../components/Modal'

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
    if(!name || lng==='' || lat==='' ) return alert('Please provide name, longitude and latitude')
    try{
      await addLocation({ name, longitude: Number(lng), latitude: Number(lat) })
      alert('Location added')
      setName(''); setLng(''); setLat('')
      loadLocations()
    }catch(e){ alert(e?.response?.data?.message || 'Failed to add location') }
  }

  const handleDelete = async (locId)=>{
    if(!locId) return
    if(!confirm('Delete location? This action cannot be undone.')) return
    try{
      await deleteLocation(locId)
      alert('Location deleted')
      loadLocations()
    }catch(e){ alert(e?.response?.data?.message || 'Failed to delete location') }
  }

  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [viewLocation, setViewLocation] = useState(null)

  const handleView = async (loc) => {
    try{
      // fetch full location details from backend (coordinates are not returned by list endpoint)
      const res = await api.get(`/location/${loc._id}`)
      const full = res?.data?.data || loc
      setViewLocation(full)
      setViewModalOpen(true)
    }catch(e){
      // fallback to using existing object
      setViewLocation(loc)
      setViewModalOpen(true)
    }
  }

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-2xl font-semibold mb-4">Manage Locations</h3>

      {/* Add Location Panel */}
      <div className="w-full flex justify-center">
        <div className="w-full md:w-11/12 lg:w-10/12 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="text-sm text-gray-300">Location Name</label>
              <input value={name} onChange={e=>setName(e.target.value)} placeholder="Enter location name" className="w-full mt-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm" />
            </div>

            <div>
              <label className="text-sm text-gray-300">Longitude</label>
              <input value={lng} onChange={e=>setLng(e.target.value)} placeholder="Longitude" type="number" step="any" className="w-full mt-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm" />
            </div>

            <div>
              <label className="text-sm text-gray-300">Latitude</label>
              <input value={lat} onChange={e=>setLat(e.target.value)} placeholder="Latitude" type="number" step="any" className="w-full mt-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm" />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button onClick={handleAdd} className="px-6 py-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-purple-600 hover:to-blue-600 text-white transform hover:-translate-y-0.5">Add Location</button>
          </div>
        </div>
      </div>

      <hr className="border-white/10 mt-8 mb-6" />

      {/* Locations Grid (scrollable) */}
      <div className="flex-1 overflow-auto hide-scrollbar">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {loading && <div className="text-gray-400">Loading locations...</div>}
          {!loading && locations.length===0 && <div className="text-gray-400">No locations found</div>}

          {!loading && locations.map(l => (
            <div key={l._id} onClick={()=>handleView(l)} className="bg-white/10 rounded-2xl p-3 pb-6 shadow-md transform hover:shadow-lg hover:-translate-y-1 transition duration-150 ease-out flex flex-col justify-between cursor-pointer">
              <div className="mb-2">
                <div className="text-base font-semibold">{l.name}</div>
              </div>

              <div className="flex items-center justify-end gap-2 flex-wrap">
                <button onClick={(e)=>{ e.stopPropagation(); handleDelete(l._id) }} className="px-2 py-1 border border-red-600 text-red-600 rounded hover:bg-red-600 hover:text-white transition text-sm whitespace-nowrap">Remove</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {viewModalOpen && (
        <Modal open={true} title={viewLocation?.name || 'Location details'} onClose={() => { setViewModalOpen(false); setViewLocation(null) }}>
          <div className="text-sm">
            <div className="mb-2"><strong>Name:</strong> {viewLocation?.name || '-'}</div>
            <div className="mb-2"><strong>Longitude:</strong> {viewLocation?.longitude ?? (viewLocation?.coordinates && viewLocation.coordinates?.coordinates && viewLocation.coordinates.coordinates[0]) ?? '-'}</div>
            <div className="mb-2"><strong>Latitude:</strong> {viewLocation?.latitude ?? (viewLocation?.coordinates && viewLocation.coordinates?.coordinates && viewLocation.coordinates.coordinates[1]) ?? '-'}</div>
            {viewLocation?.description && <div className="mb-2"><strong>Description:</strong> {viewLocation.description}</div>}
          </div>
        </Modal>
      )}
    </div>
  )
}
