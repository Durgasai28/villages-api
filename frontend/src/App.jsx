import { useEffect, useState } from "react";
import API from "./api";

function App() {

  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [subdistricts, setSubdistricts] = useState([]);
  const [villages, setVillages] = useState([]);

  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStates();
  }, []);

  const fetchStates = async () => {
    setLoading(true);
    const res = await API.get("/states");
    setStates(res.data);
    setLoading(false);
  };

  const fetchDistricts = async (id) => {
    setLoading(true);
    setDistricts([]);
    setSubdistricts([]);
    setVillages([]);

    const res = await API.get(`/districts?state=${id}`);
    setDistricts(res.data);
    setLoading(false);
  };

  const fetchSubdistricts = async (id) => {
    setLoading(true);
    setSubdistricts([]);
    setVillages([]);

    const res = await API.get(`/subdistricts?district=${id}`);
    setSubdistricts(res.data);
    setLoading(false);
  };

  const fetchVillages = async (id) => {
    setLoading(true);
    const res = await API.get(`/villages?subdistrict=${id}`);
    setVillages(res.data);
    setLoading(false);
  };

  const searchVillage = async () => {
    setLoading(true);
    const res = await API.get(`/search?q=${search}`);
    setSearchResults(res.data);
    setLoading(false);
  };

  return (
    <div className="container">

      <h1>All India Villages Explorer</h1>

      {/* Search */}
      <div className="card">
        <h3>Search Village</h3>

        <input
          type="text"
          placeholder="Enter village name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button onClick={searchVillage}>Search</button>

        {loading && <div className="loader"></div>}

        <table>
          <thead>
            <tr>
              <th>Village</th>
              <th>Subdistrict</th>
              <th>District</th>
              <th>State</th>
            </tr>
          </thead>
          <tbody>
            {searchResults.map(v => (
              <tr key={v.id}>
                <td>{v.village}</td>
                <td>{v.subdistrict}</td>
                <td>{v.district}</td>
                <td>{v.state}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Dropdowns */}
      <div className="card">
        <h3>Browse by Hierarchy</h3>

        <select onChange={(e) => fetchDistricts(e.target.value)}>
          <option>Select State</option>
          {states.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <select onChange={(e) => fetchSubdistricts(e.target.value)}>
          <option>Select District</option>
          {districts.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>

        <select onChange={(e) => fetchVillages(e.target.value)}>
          <option>Select Subdistrict</option>
          {subdistricts.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        {loading && <div className="loader"></div>}

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Village</th>
            </tr>
          </thead>
          <tbody>
            {villages.map(v => (
              <tr key={v.id}>
                <td>{v.id}</td>
                <td>{v.name}</td>
              </tr>
            ))}
          </tbody>
        </table>

      </div>

    </div>
  );
}

export default App;