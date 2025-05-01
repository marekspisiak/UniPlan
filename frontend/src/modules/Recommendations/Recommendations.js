import { useEffect, useState, useRef } from "react";
import {
  Spinner,
  Alert,
  Form,
  Button,
  Collapse,
  Container,
  Row,
  Col,
} from "react-bootstrap";
import EventCard from "../../components/EventCard/EventCard";
import styles from "./Recommendations.module.scss";
import CategoryMultiSelect from "../../components/CategoryMultiSelect/CategoryMultiSelect";
import { useAuth } from "../../context/AuthContext";
import { getCurrentUTCDate } from "../../utils/dateUtils";
import { FixedSizeList } from "react-window";
import InfiniteScroll from "react-infinite-scroll-component";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { recommendationsFilterSchema } from "../../validation/schemas";

const Recommendations = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [shownEvents, setShownEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDays, setShowDays] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const onlyRecommendedRef = useRef(null);
  const sidebarRef = useRef(null);

  const userInterestsIds = user.interests.map((interest) => interest.id);

  const defaultFilter = {
    search: "",
    searchLocation: "",
    onlyAvailable: false,
    onlyRecommended: false,
    useMyInterests: true,
    selectedCategories: [],
    allCategories: false,
    onlySingle: false,
    onlyRecurring: false,
    daysOfWeek: [],
    startDate: getCurrentUTCDate().toISOString().split("T")[0],
    endDate: new Date(getCurrentUTCDate().getTime() + 14 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],

    startTime: "",
    endTime: "",
    manage: false,
    myEvents: false,
  };
  const [filters, setFilters] = useState(defaultFilter);

  useEffect(() => {
    if (
      filters.onlyRecommended &&
      onlyRecommendedRef.current &&
      sidebarRef.current
    ) {
      const sidebar = sidebarRef.current;
      const target = onlyRecommendedRef.current;

      const sidebarTop = sidebar.getBoundingClientRect().top;
      const targetTop = target.getBoundingClientRect().top;

      const offset = targetTop - sidebarTop;

      sidebar.scrollTo({
        top: sidebar.scrollTop + offset,
        behavior: "smooth",
      });
    }
  }, [filters.onlyRecommended]);

  const loadMoreEvents = () => {
    const itemsPerPage = 10; // Po koľko kusov chceš naraz pridávať
    const nextItems = events.slice(
      shownEvents.length,
      shownEvents.length + itemsPerPage
    );
    setShownEvents((prev) => [...prev, ...nextItems]);
  };

  useEffect(() => {
    if (events.length > 0) {
      loadMoreEvents();
    }
  }, [events]); // ⬅️ sleduje activitie

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const query = new URLSearchParams();
      if (filters.search) query.append("search", filters.search);
      if (filters.searchLocation)
        query.append("searchLocation", filters.searchLocation);

      if (filters.onlyAvailable) query.append("onlyAvailable", "true");
      if (filters.manage) query.append("manage", "true");
      if (filters.myEvents) query.append("myEvents", "true");

      if (filters.onlyRecommended) {
        const selectedIds = filters.useMyInterests
          ? userInterestsIds
          : filters.selectedCategories;

        selectedIds.forEach((id) => query.append("categories", id));

        if (filters.allCategories) {
          query.append("allCategories", "true");
        }
      }

      if (filters.onlySingle) query.append("onlySingle", "true");
      if (filters.onlyRecurring) query.append("onlyRecurring", "true");
      if (filters.startDate) query.append("startDate", filters.startDate);
      if (filters.endDate) query.append("endDate", filters.endDate);
      if (filters.startTime) query.append("startTime", filters.startTime);
      if (filters.endTime) query.append("endTime", filters.endTime);

      filters.daysOfWeek.forEach((day) => query.append("daysOfWeek", day));

      const res = await fetch(`/api/events/get?${query.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Nepodarilo sa načítať aktivity");
      console.log(data);
      setEvents(data); // nastav nový celý zoznam
      setShownEvents(data.slice(0, 10));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchEvents();
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchEvents();
    if (window.innerWidth <= 768) {
      setShowFilters(false);
    }
    window.scrollTo(0, 0);
  };

  const toggleDay = (day) => {
    setFilters((prev) => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter((d) => d !== day)
        : [...prev.daysOfWeek, day],
    }));
  };

  return (
    <div className={styles.recommendations}>
      <div className={styles.mobileFiltersToggle}>
        <Button
          className={styles.searchButton}
          variant="primary"
          size="sm"
          onClick={() => setShowFilters((prev) => !prev)}
        >
          {showFilters ? "Skryť filtre" : "Zobraziť filtre"}
        </Button>
      </div>

      <div className={styles.mainContent}>
        <Collapse in={showFilters || window.innerWidth > 768}>
          <div ref={sidebarRef} className={styles.sidebar}>
            <div className="fs-2 fw-bold mb-3">Vyhľadať</div>
            <Form onSubmit={handleSearch} className={styles.filters}>
              {/* Sekcia: Vyhľadávanie */}
              <div className={styles.filterSection}>
                <Form.Control
                  type="text"
                  placeholder="Hľadať podľa názvu..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                />
                <Form.Control
                  type="text"
                  placeholder="Hľadať podľa polohy"
                  value={filters.searchLocation}
                  onChange={(e) =>
                    setFilters({ ...filters, searchLocation: e.target.value })
                  }
                />
              </div>

              {/* Sekcia: Dátum + čas */}
              <div className={styles.dateTimeGrid}>
                <Form.Control
                  type="date"
                  value={filters.startDate}
                  required
                  onChange={(e) => {
                    const newStartDate = e.target.value;
                    setFilters((prev) => ({
                      ...prev,
                      startDate: newStartDate,
                      endDate:
                        prev.endDate && prev.endDate < newStartDate
                          ? newStartDate
                          : prev.endDate,
                    }));
                  }}
                />
                <Form.Control
                  type="date"
                  value={filters.endDate}
                  required
                  min={filters.startDate}
                  onChange={(e) =>
                    setFilters({ ...filters, endDate: e.target.value })
                  }
                />
                <Form.Control
                  type="time"
                  value={filters.startTime}
                  onChange={(e) =>
                    setFilters({ ...filters, startTime: e.target.value })
                  }
                />
                <Form.Control
                  type="time"
                  value={filters.endTime}
                  min={filters.startTime}
                  onChange={(e) =>
                    setFilters({ ...filters, endTime: e.target.value })
                  }
                />
              </div>

              {/* Sekcia: Vybrať konkrétne dni */}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowDays(!showDays)}
                className="mb-2"
              >
                {showDays ? "Skryť dni" : "Vybrať konkrétne dni"}
              </Button>
              <Collapse in={showDays}>
                <div className={styles.daysGrid}>
                  {[
                    "Pondelok",
                    "Utorok",
                    "Streda",
                    "Štvrtok",
                    "Piatok",
                    "Sobota",
                    "Nedeľa",
                  ].map((day, index) => (
                    <Form.Check
                      key={index}
                      type="checkbox"
                      label={day}
                      checked={filters.daysOfWeek.includes(index + 1)}
                      onChange={() => toggleDay(index + 1)}
                    />
                  ))}
                </div>
              </Collapse>

              {/* Sekcia: Ďalšie filtre */}
              <div className={styles.filterSection}>
                <Form.Check
                  type="checkbox"
                  label="Filtrovať podľa záľub alebo vlastného výberu"
                  checked={filters.onlyRecommended}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      onlyRecommended: e.target.checked,
                      useMyInterests: e.target.checked
                        ? prev.useMyInterests
                        : true,
                      selectedCategories: e.target.checked
                        ? prev.selectedCategories
                        : [],
                    }))
                  }
                />
                {filters.onlyRecommended && (
                  <div ref={onlyRecommendedRef}>
                    <Form.Check
                      type="checkbox"
                      label="Použiť moje záujmy"
                      checked={filters.useMyInterests}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          useMyInterests: e.target.checked,
                          selectedCategories: e.target.checked
                            ? prev.selectedCategories
                            : [],
                        }))
                      }
                    />

                    {!filters.useMyInterests && (
                      <CategoryMultiSelect
                        selectedIds={filters.selectedCategories}
                        onChange={(newSelected) =>
                          setFilters({
                            ...filters,
                            selectedCategories: newSelected,
                          })
                        }
                      />
                    )}

                    <Form.Check
                      type="checkbox"
                      label="Všetky kategórie musia sedieť"
                      checked={filters.allCategories}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          allCategories: e.target.checked,
                        })
                      }
                    />
                  </div>
                )}
                <Form.Check
                  type="checkbox"
                  label="Moje eventy"
                  checked={filters.myEvents}
                  onChange={(e) =>
                    setFilters({ ...filters, myEvents: e.target.checked })
                  }
                />
                <Form.Check
                  type="checkbox"
                  label="Má voľnú kapacitu"
                  checked={filters.onlyAvailable}
                  onChange={(e) =>
                    setFilters({ ...filters, onlyAvailable: e.target.checked })
                  }
                />
                <Form.Check
                  type="checkbox"
                  label="Jednorazové"
                  checked={filters.onlySingle}
                  onChange={(e) =>
                    setFilters({ ...filters, onlySingle: e.target.checked })
                  }
                />
                <Form.Check
                  type="checkbox"
                  label="Opakované"
                  checked={filters.onlyRecurring}
                  onChange={(e) =>
                    setFilters({ ...filters, onlyRecurring: e.target.checked })
                  }
                />
                <Form.Check
                  type="checkbox"
                  label="Spravované"
                  checked={filters.manage}
                  onChange={(e) =>
                    setFilters({ ...filters, manage: e.target.checked })
                  }
                />
              </div>

              {/* Sekcia: Filtre podľa záujmov */}

              <div className={styles.submitWrapper}>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => setFilters(defaultFilter)}
                >
                  Resetovať filtre
                </Button>
                <Button type="submit">Vyhľadať</Button>
              </div>
            </Form>
          </div>
        </Collapse>

        <div className={styles.list}>
          {error ? (
            <div className="d-flex justify-content-center align-items-center min-vh-50">
              <Alert variant="danger">{error}</Alert>
            </div>
          ) : loading ? (
            <Container className="d-flex justify-content-center align-items-center min-vh-50">
              <Spinner animation="border" />
            </Container>
          ) : (
            <InfiniteScroll
              dataLength={shownEvents.length}
              className={styles.list}
              next={loadMoreEvents}
              hasMore={shownEvents.length < events.length}
              loader={
                <Container className="d-flex justify-content-center align-items-center min-vh-50">
                  <Spinner animation="border" />
                </Container>
              }
            >
              {shownEvents.map((event) => (
                <EventCard
                  key={`${event.id}${event.date}`}
                  event={event}
                  refetch={refetch}
                />
              ))}
            </InfiniteScroll>
          )}
        </div>
      </div>
    </div>
  );
};

export default Recommendations;
