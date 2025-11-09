import { useEffect, useState } from "react";

export default function CrisisList({ onSelect }) {
  const [crises, setCrises] = useState([]);
  const [viewMode, setViewMode] = useState("load-more"); // load-more | infinite-scroll | paginated

  const [limit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [page, setPage] = useState(0);

  const [loading, setLoading] = useState(false);
  const [noMore, setNoMore] = useState(false);

  async function fetchCrises(reset = false, customOffset = offset) {
    setLoading(true);
    const res = await fetch(
      `http://localhost:8000/crises?limit=${limit}&offset=${customOffset}`
    );
    const data = await res.json();

    if (reset) {
      setCrises(data);
    } else {
      setCrises((prev) => [...prev, ...data]);
    }

    if (data.length < limit) setNoMore(true);
    setLoading(false);
  }

  // Load on initial mount
  useEffect(() => {
    fetchCrises(true, 0);
  }, []);

  // Infinite Scroll listener
  useEffect(() => {
    if (viewMode !== "infinite-scroll") return;

    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 200
      ) {
        if (!loading && !noMore) loadMore();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [viewMode, loading, noMore, offset]);

  function loadMore() {
    const newOffset = offset + limit;
    setOffset(newOffset);
    fetchCrises(false, newOffset);
  }

  function changePage(newPage) {
    setPage(newPage);
    const newOffset = newPage * limit;
    setOffset(newOffset);
    setNoMore(false);
    fetchCrises(true, newOffset);
  }

  return (
    <div style={{
      width: "360px",
      borderRight: "1px solid #ddd",
      height: "100vh",
      overflowY: "auto",
      padding: "12px"
    }}>

      <h2 style={{ marginBottom: "10px", fontWeight: "600" }}>Crises</h2>

      {/* Mode Selector */}
      <label style={{ fontSize: "14px" }}>
        View Mode:
        <select
          style={{ marginLeft: "8px" }}
          value={viewMode}
          onChange={(e) => {
            setViewMode(e.target.value);
            setOffset(0);
            setPage(0);
            setNoMore(false);
            fetchCrises(true, 0);
          }}
        >
          <option value="load-more">Load More</option>
          <option value="infinite-scroll">Infinite Scroll</option>
          <option value="paginated">Paginated Pages</option>
        </select>
      </label>

      <div style={{ marginTop: "14px" }} />

      {crises.map((c) => (
        <div
          key={c.id}
          style={{
            padding: "8px",
            borderBottom: "1px solid #eee",
            cursor: "pointer"
          }}
          onClick={() => onSelect && onSelect(c)}
        >
          <div style={{ fontWeight: "600" }}>{c.title}</div>
          <div style={{ fontSize: "12px", color: "#666" }}>{c.category}</div>
          <div style={{ fontSize: "12px", marginTop: "4px" }}>
            Severity: {c.severity}
          </div>
        </div>
      ))}

      {/* Load More Button */}
      {viewMode === "load-more" && !noMore && (
        <button
          style={{
            marginTop: "12px",
            width: "100%",
            padding: "8px",
            background: "#1e88e5",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer"
          }}
          onClick={loadMore}
        >
          {loading ? "Loading..." : "Load More"}
        </button>
      )}

      {/* Pagination Mode */}
      {viewMode === "paginated" && (
        <div style={{ marginTop: "14px", display: "flex", gap: "8px" }}>
          <button
            disabled={page === 0}
            onClick={() => changePage(page - 1)}
          >
            Prev
          </button>
          <span>Page {page + 1}</span>
          <button
            disabled={noMore}
            onClick={() => changePage(page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
