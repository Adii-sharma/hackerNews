import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Search, LogOut, Loader } from "lucide-react";
import axios from "axios";
import "./HackerNewsSearch.css";
import logo from './logo.png'

const HackerNewsSearch = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const username = localStorage.getItem("username");

  const [filters, setFilters] = useState({
    type: "all",
    sortBy: "search",
    timeRange: "all_time",
    page: 0,
    hitsPerPage: 20,
  });

  useEffect(() => {
    fetchSearchResults("", 0);
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const query = urlParams.get("query") || "";
    const page = parseInt(urlParams.get("page")) || 0;

    setSearchQuery(query);
    setFilters((prev) => ({ ...prev, page }));

    const timeoutId = setTimeout(() => {
      fetchSearchResults(query, page);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [location.search]);

  const getTimeRangeFilter = (timeRange) => {
    const now = Math.floor(Date.now() / 1000);
    switch (timeRange) {
      case "last_24h":
        return `created_at_i>${now - 86400}`;
      case "past_week":
        return `created_at_i>${now - 604800}`;
      case "past_month":
        return `created_at_i>${now - 2592000}`;
      case "past_year":
        return `created_at_i>${now - 31536000}`;
      default:
        return "";
    }
  };

  const fetchSearchResults = async (
    query = searchQuery,
    page = filters.page
  ) => {
    try {
      setLoading(true);
      const endpoint = filters.sortBy === "date" ? "search_by_date" : "search";
      const timeFilter = getTimeRangeFilter(filters.timeRange);

      const response = await axios.get(
        `https://hn.algolia.com/api/v1/${endpoint}`,
        {
          params: {
            query,
            tags: filters.type !== "all" ? filters.type : undefined,
            page,
            hitsPerPage: filters.hitsPerPage,
            numericFilters: timeFilter || undefined,
          },
        }
      );

      setSearchResults(response.data.hits);
      setTotalPages(response.data.nbPages);

      if (query.trim()) {
        const newHistory = [
          ...searchHistory,
          {
            query,
            timestamp: new Date().toISOString(),
          },
        ];
        setSearchHistory(newHistory.slice(-10));
        localStorage.setItem("searchHistory", JSON.stringify(newHistory));
      }
    } catch (error) {
      console.error("Error fetching search results:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (type, value) => {
    const newFilters = { ...filters, [type]: value, page: 0 };
    setFilters(newFilters);
    fetchSearchResults(searchQuery, 0);
  };

  const handlePageChange = (newPage) => {
    const newParams = new URLSearchParams(location.search);
    newParams.set("page", newPage.toString());
    navigate(`?${newParams.toString()}`);
    setFilters((prev) => ({ ...prev, page: newPage }));
    fetchSearchResults(searchQuery, newPage);
  };

  const handleSearchChange = (e) => {
    const newQuery = e.target.value;
    setSearchQuery(newQuery);
    const newParams = new URLSearchParams(location.search);
    newParams.set("query", newQuery);
    navigate(`?${newParams.toString()}`);
  };

  const handleLogout = () => {
    localStorage.removeItem("username");
    navigate("/login");
  };

  return (
    <div className="hn-container">
      <header className="hn-header">
        <div className="hn-header-content">
          <div className="hn-logo-section">
            <div className="hn-logo">H</div>
            <div className="hn-title">
              <div>{username}</div>
            </div>
          </div>

          <div className="hn-search-section">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search stories by title, url or author"
              className="hn-search-input"
            />
            <div className="hn-search-branding">
              <span>Search by</span>
              <img
                src={logo}
                alt="Algolia"
              />
            </div>
          </div>
        </div>
      </header>

      <div className="hn-filters">
        <span>Search</span>
        <select
          value={filters.type}
          onChange={(e) => handleFilterChange("type", e.target.value)}
          className="hn-filter-select"
        >
          <option value="all">All</option>
          <option value="story">Stories</option>
          <option value="comment">Comments</option>
          <option value="ask_hn">Ask HN</option>
          <option value="show_hn">Show HN</option>
          <option value="launch_hn">Launch HN</option>
          <option value="job">Jobs</option>
          <option value="poll">Polls</option>
        </select>

        <span>by</span>

        <select
          value={filters.sortBy}
          onChange={(e) => handleFilterChange("sortBy", e.target.value)}
          className="hn-filter-select"
        >
          <option value="search">Popularity</option>
          <option value="date">Date</option>
        </select>

        <span>for</span>

        <select
          value={filters.timeRange}
          onChange={(e) => handleFilterChange("timeRange", e.target.value)}
          className="hn-filter-select"
        >
          <option value="all_time">All time</option>
          <option value="last_24h">Last 24h</option>
          <option value="past_week">Past Week</option>
          <option value="past_month">Past Month</option>
          <option value="past_year">Past Year</option>
        </select>
      </div>

      <main className="hn-main-content">
        {loading ? (
          <div className="hn-loading">
            <Loader className="hn-loading-spinner" />
          </div>
        ) : (
          <div className="hn-results">
            {searchResults.map((result) => (
              <article key={result.objectID} className="hn-result-item">
                <h2 className="hn-result-title">
                  <a
                    href={
                      result.url ||
                      `https://news.ycombinator.com/item?id=${result.objectID}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hn-result-link"
                  >
                    {result.title || result.story_title || result.comment_text}
                  </a>
                  {result.url && (
                    <span className="hn-result-domain">
                      ({new URL(result.url).hostname})
                    </span>
                  )}
                </h2>
                <div className="hn-result-meta">
                  {result.points || 0} points | by {result.author} |{" "}
                  {result.num_comments || 0} comments
                </div>
              </article>
            ))}
          </div>
        )}

        {totalPages > 0 && (
          <div className="hn-pagination">
            <button
              onClick={() => handlePageChange(filters.page - 1)}
              disabled={filters.page === 0}
              className="hn-pagination-button"
            >
              Previous
            </button>
            <span className="hn-pagination-info">
              Page {filters.page + 1} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(filters.page + 1)}
              disabled={filters.page >= totalPages - 1}
              className="hn-pagination-button"
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default HackerNewsSearch;
