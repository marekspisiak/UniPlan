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
import { ValidatedField } from "../../components/ValidateComponents/ValidateComponents";
import LoadingButton from "../../components/LoadingButton/LoadingButton";
import { useMediaQuery } from "react-responsive";

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
  // const isTablet = useMediaQuery({ maxWidth: 768 });
  const isMobile = useMediaQuery({ maxWidth: 767 });

  const userInterestsIds = user.interests.map((interest) => interest.id);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(recommendationsFilterSchema),
    defaultValues: {
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
      endDate: new Date(
        getCurrentUTCDate().getTime() + 14 * 24 * 60 * 60 * 1000
      )
        .toISOString()
        .split("T")[0],
      startTime: "",
      endTime: "",
      manage: false,
      myEvents: false,
    },
  });

  const startDate = watch("startDate");
  const endDate = watch("endDate");
  const onlyRecommended = watch("onlyRecommended");
  const startTime = watch("startTime");
  const useMyInterests = watch("useMyInterests");
  const selectedCategories = watch("selectedCategories");

  useEffect(() => {
    if (endDate && endDate < startDate) {
      setValue("endDate", startDate);
    }
  }, [startDate]);

  useEffect(() => {
    if (onlyRecommended && onlyRecommendedRef.current && sidebarRef.current) {
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
  }, [onlyRecommended]);

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
      const filters = getValues();
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

  const onSubmit = (e) => {
    fetchEvents();
    if (isMobile) {
      setShowFilters(false);
    }
    window.scrollTo(0, 0);
  };

  const daysOfWeek = watch("daysOfWeek") || [];

  const toggleDay = (day) => {
    const updated = daysOfWeek.includes(day)
      ? daysOfWeek.filter((d) => d !== day)
      : [...daysOfWeek, day];

    setValue("daysOfWeek", updated);
  };

  return (
    <div className={styles.recommendations}>
      <div className={`${styles.mobileFiltersToggle}`}>
        <Button
          className={styles.searchButton}
          variant="primary"
          size="sm"
          onClick={() => {
            setShowFilters((prev) => !prev);

            showFilters &&
              sidebarRef.current.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          {showFilters ? "Skryť filtre" : "Zobraziť filtre"}
        </Button>
      </div>

      <div className={styles.mainContent}>
        <Collapse in={showFilters || !isMobile}>
          <div ref={sidebarRef} className={styles.sidebar}>
            <div className="fs-3 fw-bold mb-3">Vyhľadať</div>
            <Form onSubmit={handleSubmit(onSubmit)} className={styles.filters}>
              {/* Sekcia: Vyhľadávanie */}

              <div className={styles.filterSection}>
                <ValidatedField
                  type="text"
                  name="search"
                  placeholder="Hľadať podľa názvu..."
                  register={register}
                  errors={errors}
                />
                <ValidatedField
                  type="text"
                  name="searchLocation"
                  placeholder="Hľadať podľa polohy"
                  register={register}
                  errors={errors}
                />
              </div>

              {/* Sekcia: Dátum + čas */}
              <div className={styles.dateTimeGrid}>
                <ValidatedField
                  type="date"
                  name="startDate"
                  label="Dátum od"
                  register={register}
                  errors={errors}
                  clean
                />

                <ValidatedField
                  type="date"
                  name="endDate"
                  label="Dátum do"
                  register={register}
                  errors={errors}
                  x
                  min={startDate}
                  clean
                />
                <ValidatedField
                  type="time"
                  name="startTime"
                  register={register}
                  errors={errors}
                />
                <ValidatedField
                  type="time"
                  name="endTime"
                  register={register}
                  errors={errors}
                  min={startTime}
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
                      checked={daysOfWeek.includes(index + 1)}
                      onChange={() => toggleDay(index + 1)}
                    />
                  ))}
                </div>
              </Collapse>

              {/* Sekcia: Ďalšie filtre */}
              <div className={styles.filterSection}>
                <ValidatedField
                  clean
                  type="checkbox"
                  name="onlyRecommended"
                  label="Filtrovať podľa záľub alebo vlastného výberu"
                  checked={onlyRecommended}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setValue("onlyRecommended", checked);
                    setValue("useMyInterests", checked ? useMyInterests : true);
                    setValue(
                      "selectedCategories",
                      checked ? selectedCategories : []
                    );
                  }}
                  register={register}
                  errors={errors}
                />
                {onlyRecommended && (
                  <div ref={onlyRecommendedRef}>
                    <ValidatedField
                      clean
                      type="checkbox"
                      label="Použiť moje záujmy"
                      name="useMyInterests"
                      checked={useMyInterests}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setValue("useMyInterests", checked);
                        setValue(
                          "selectedCategories",
                          checked ? selectedCategories : []
                        );
                      }}
                      register={register}
                      errors={errors}
                    />

                    {!useMyInterests && (
                      <CategoryMultiSelect
                        selectedIds={selectedCategories}
                        onChange={(newSelected) =>
                          setValue("selectedCategories", newSelected)
                        }
                      />
                    )}

                    <ValidatedField
                      clean
                      type="checkbox"
                      label="Všetky kategórie musia sedieť"
                      name="allCategories"
                      register={register}
                      errors={errors}
                    />
                  </div>
                )}
                <ValidatedField
                  clean
                  type="checkbox"
                  label="Moje eventy"
                  name="myEvents"
                  register={register}
                  errors={errors}
                />

                <ValidatedField
                  clean
                  type="checkbox"
                  label="Má voľnú kapacitu"
                  name="onlyAvailable"
                  register={register}
                  errors={errors}
                />

                <ValidatedField
                  clean
                  type="checkbox"
                  label="Jednorazové"
                  name="onlySingle"
                  register={register}
                  errors={errors}
                />

                <ValidatedField
                  clean
                  type="checkbox"
                  label="Opakované"
                  name="onlyRecurring"
                  register={register}
                  errors={errors}
                />

                <ValidatedField
                  clean
                  type="checkbox"
                  label="Spravované"
                  name="manage"
                  register={register}
                  errors={errors}
                />
              </div>

              {/* Sekcia: Filtre podľa záujmov */}

              <div className={styles.submitWrapper}>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => reset()}
                >
                  Resetovať filtre
                </Button>
                <LoadingButton type="submit" loading={loading}>
                  Vyhľadať
                </LoadingButton>
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
