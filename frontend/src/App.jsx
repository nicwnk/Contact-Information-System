```jsx
import { useEffect, useState } from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useParams
} from "react-router-dom";

import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap
} from "react-leaflet";

import L from "leaflet";

import {
  getCountries,
  getCountryCallingCode,
  isValidPhoneNumber
} from "libphonenumber-js";

import "leaflet/dist/leaflet.css";
import "./App.css";

// ==========================
// FIX LEAFLET MARKER
// ==========================

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({

  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",

  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",

  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png"

});

// ==========================
// COUNTRY LIST
// ==========================

const countryNames = new Intl.DisplayNames(
  ["en"],
  {
    type: "region"
  }
);

const countries = getCountries()
  .map((country) => ({
    code: country,
    name: countryNames.of(country),
    callingCode: getCountryCallingCode(country)
  }))
  .sort((a, b) =>
    a.name.localeCompare(b.name)
  );

// ==========================
// MAP CLICK
// ==========================

function LocationMarker({
  position,
  setPosition,
  setAddress
}) {

  useMapEvents({

    click: async (e) => {

      const newPosition = [
        e.latlng.lat,
        e.latlng.lng
      ];

      setPosition(newPosition);

      try {

        const response = await fetch(

          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${e.latlng.lat}&lon=${e.latlng.lng}&zoom=18&addressdetails=1`,

          {
            headers: {
              Accept: "application/json"
            }
          }

        );

        const data =
          await response.json();

        if (data.display_name) {

          setAddress(
            data.display_name
          );

        }

      }

      catch (error) {

        console.error(
          "Could not get address:",
          error
        );

      }

    }

  });

  return position === null
    ? null
    : <Marker position={position} />;

}

// ==========================
// MOVE MAP TO LOCATION
// ==========================

function MapCenter({
  position
}) {

  const map = useMap();

  useEffect(() => {

    if (position) {

      map.flyTo(
        position,
        17
      );

    }

  }, [position, map]);

  return null;

}

// ==========================
// MAP SEARCH
// ==========================

function MapSearch({
  setPosition,
  setAddress
}) {

  const [searchLocation, setSearchLocation] =
    useState("");

  const [searching, setSearching] =
    useState(false);

  const handleMapSearch = async () => {

    if (
      searchLocation.trim() === ""
    ) {

      alert(
        "Please enter a location to search."
      );

      return;

    }

    try {

      setSearching(true);

      const response = await fetch(

        `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(searchLocation)}&limit=1`,

        {
          headers: {
            Accept: "application/json"
          }
        }

      );

      if (!response.ok) {

        throw new Error(
          "Location search failed"
        );

      }

      const data =
        await response.json();

      if (data.length === 0) {

        alert(
          "Location not found. Please try another search."
        );

        return;

      }

      const latitude =
        parseFloat(data[0].lat);

      const longitude =
        parseFloat(data[0].lon);

      setPosition([
        latitude,
        longitude
      ]);

      setAddress(
        data[0].display_name
      );

    }

    catch (error) {

      console.error(
        "Location search error:",
        error
      );

      alert(
        "Could not search for the location."
      );

    }

    finally {

      setSearching(false);

    }

  };

  return (

    <div className="map-search">

      <input
        type="text"
        placeholder="Search a location..."
        value={searchLocation}
        onChange={(e) =>
          setSearchLocation(
            e.target.value
          )
        }
        onKeyDown={(e) => {

          if (e.key === "Enter") {

            handleMapSearch();

          }

        }}
      />

      <button
        type="button"
        onClick={handleMapSearch}
        disabled={searching}
      >

        {searching
          ? "Searching..."
          : "🔍 Search"}

      </button>

    </div>

  );

}

// ==========================
// LOCATION MAP
// ==========================

function LocationMap({
  position,
  setPosition,
  setAddress
}) {

  return (

    <>

      <MapSearch

        setPosition={setPosition}

        setAddress={setAddress}

      />

      <MapContainer

        center={
          position ||
          [15.145, 120.588]
        }

        zoom={15}

        className="location-map"

      >

        <TileLayer

          attribution="&copy; OpenStreetMap contributors"

          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"

        />

        <MapCenter
          position={position}
        />

        <LocationMarker

          position={position}

          setPosition={setPosition}

          setAddress={setAddress}

        />

      </MapContainer>

    </>

  );

}

// ==========================
// WELCOME PAGE
// ==========================

function Welcome() {

  return (

    <div className="welcome-page">

      <div className="welcome-glow"></div>

      <div className="welcome-content">

        <div className="welcome-icon">
            ☏
        </div>

        <p className="welcome-label">
          CONTACT MANAGEMENT SYSTEM
        </p>

        <h1>

          Contact Information

          <span>
            Manager
          </span>

        </h1>

        <p className="welcome-description">

          Manage all your contacts in one place.
          Keep your contact information organized,
          accessible, and secure.

        </p>

        <Link to="/add-contact">

          <button className="get-started-button">

            Get Started

            <span>
              →
            </span>

          </button>

        </Link>

        <p className="welcome-footer">

          Simple • Organized • Efficient

        </p>

      </div>

    </div>

  );

}

// ==========================
// ADD CONTACT PAGE
// ==========================

function Home() {

  const [form, setForm] = useState({

    first_name: "",
    middle_initial: "",
    last_name: "",
    phone: "",
    email: "",
    personal_email: "",
    address: "",
    profile_picture: ""

  });

  const [selectedCountry, setSelectedCountry] =
    useState("PH");

  const [showMap, setShowMap] =
    useState(false);

  const [position, setPosition] =
    useState(null);

  const [locationLoading, setLocationLoading] =
    useState(false);

  const [showSuccess, setShowSuccess] =
    useState(false);

  const [showPhoneError, setShowPhoneError] =
    useState(false);

  const [phoneErrorMessage, setPhoneErrorMessage] =
    useState("");

  const [showDuplicatePhone, setShowDuplicatePhone] =
    useState(false);

  const [duplicatePhoneMessage, setDuplicatePhoneMessage] =
    useState("");

  // ==========================
  // HANDLE INPUT
  // ==========================

  const handleChange = (e) => {

    setForm({

      ...form,

      [e.target.name]:
        e.target.value

    });

  };

  // ==========================
  // PROFILE PICTURE
  // ==========================

  const handleProfilePicture = (e) => {

    const file =
      e.target.files[0];

    if (!file) {

      return;

    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {

      alert(
        "Profile picture must be less than 5MB."
      );

      return;

    }

    const reader =
      new FileReader();

    reader.onload = () => {

      setForm({

        ...form,

        profile_picture:
          reader.result

      });

    };

    reader.readAsDataURL(file);

  };

  // ==========================
  // GET PLACE NAME
  // ==========================

  const getPlaceName = async (
    lat,
    lng
  ) => {

    try {

      setLocationLoading(true);

      const response = await fetch(

        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,

        {

          headers: {

            Accept:
              "application/json"

          }

        }

      );

      if (!response.ok) {

        throw new Error(
          "Unable to find address"
        );

      }

      const data =
        await response.json();

      if (data.display_name) {

        return data.display_name;

      }

      return "Selected location";

    }

    catch (error) {

      console.error(
        "Reverse geocoding error:",
        error
      );

      return "Selected location";

    }

    finally {

      setLocationLoading(false);

    }

  };

  // ==========================
  // USE CURRENT LOCATION
  // ==========================

  const useCurrentLocation = () => {

    if (!navigator.geolocation) {

      alert(
        "Your browser does not support location services."
      );

      return;

    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(

      async (location) => {

        const lat =
          location.coords.latitude;

        const lng =
          location.coords.longitude;

        setPosition([

          lat,
          lng

        ]);

        const placeName =
          await getPlaceName(

            lat,

            lng

          );

        setForm({

          ...form,

          address:
            placeName

        });

        setShowMap(true);

      },

      () => {

        setLocationLoading(false);

        alert(
          "Unable to get your location. Please allow location access."
        );

      }

    );

  };

  // ==========================
  // CONFIRM LOCATION
  // ==========================

  const confirmLocation = async () => {

    if (!position) {

      alert(
        "Please click on the map or search for a location."
      );

      return;

    }

    const lat =
      position[0];

    const lng =
      position[1];

    const placeName =
      await getPlaceName(

        lat,

        lng

      );

    setForm({

      ...form,

      address:
        placeName

    });

    setShowMap(false);

  };

  // ==========================
  // ADD CONTACT
  // ==========================

  const handleSubmit = async (e) => {

    e.preventDefault();

    // ==========================
    // REQUIRED FIELD VALIDATION
    // ==========================

    if (
      form.first_name.trim() === ""
    ) {

      alert(
        "Please enter the first name."
      );

      return;

    }

    if (
      form.last_name.trim() === ""
    ) {

      alert(
        "Please enter the last name."
      );

      return;

    }

    if (
      form.phone.trim() === ""
    ) {

      alert(
        "Please enter the phone number."
      );

      return;

    }

    if (
      form.address.trim() === ""
    ) {

      alert(
        "Please enter an address or pin a location."
      );

      return;

    }

    try {

      // ==========================
      // PHONE VALIDATION
      // ==========================

      let phoneNumber =
        form.phone.trim();

      phoneNumber =
        phoneNumber.replace(
          /[\s\-()]/g,
          ""
        );

      // ==========================
      // PHILIPPINES FORMAT
      // ==========================

      if (
        selectedCountry === "PH" &&
        phoneNumber.startsWith("0")
      ) {

        phoneNumber =
          phoneNumber.substring(1);

      }

      // ==========================
      // PHONE VALIDATION
      // ==========================

      const isValid =
        isValidPhoneNumber(
          phoneNumber,
          selectedCountry
        );

      if (!isValid) {

        setPhoneErrorMessage(

          `Please enter a valid ${countryNames.of(selectedCountry)} phone number.`

        );

        setShowPhoneError(true);

        return;

      }

      // ==========================
      // COUNTRY CODE
      // ==========================

      const callingCode =
        getCountryCallingCode(
          selectedCountry
        );

      const fullPhone =
        `+${callingCode} ${phoneNumber}`;

      // ==========================
      // SEND CONTACT
      // ==========================

      const response = await fetch(

        "/api/contacts/",

        {

          method: "POST",

          headers: {

            "Content-Type":
              "application/json"

          },

          body: JSON.stringify({

            ...form,

            phone:
              fullPhone

          })

        }

      );

      const data =
        await response.json();

      // ==========================
      // ERROR RESPONSE
      // ==========================

      if (!response.ok) {

        if (
          data.message &&
          data.message
            .toLowerCase()
            .includes("already")
        ) {

          setDuplicatePhoneMessage(
            data.message
          );

          setShowDuplicatePhone(true);

          return;

        }

        alert(
          data.message
        );

        return;

      }

      // ==========================
      // RESET FORM
      // ==========================

      setForm({

        first_name: "",
        middle_initial: "",
        last_name: "",
        phone: "",
        email: "",
        personal_email: "",
        address: "",
        profile_picture: ""

      });

      setSelectedCountry("PH");

      setPosition(null);

      // ==========================
      // SUCCESS
      // ==========================

      setShowSuccess(true);

      setTimeout(() => {

        setShowSuccess(false);

      }, 3000);

    }

    catch (error) {

      alert(
        "Could not connect to the server. Make sure server.cjs is running."
      );

    }

  };

  return (

    <div className="container">

      {/* ==========================
          NAVIGATION
      ========================== */}

      <div className="page-header">

        <div className="header-left">

          <Link
            to="/"
            className="back-button"
          >

            ← Back

          </Link>

          <Link
            to="/"
            className="logo-link"
          >

            Contact Manager

          </Link>

        </div>

        <Link to="/contacts">

          <button className="nav-contacts-button">

            View Contacts

          </button>

        </Link>

      </div>

      {/* ==========================
          FORM
      ========================== */}

      <div className="form-section">

        <p className="section-label">
          ADD NEW CONTACT
        </p>

        <h1>
          Contact Information
        </h1>

        <p className="section-description">

          Enter the contact details below to add
          a new contact to your database.

        </p>

        <form onSubmit={handleSubmit}>

          {/* PROFILE PICTURE */}

          <div className="profile-picture-section">

            <div className="profile-picture-preview">

              {form.profile_picture ? (

                <img
                  src={form.profile_picture}
                  alt="Profile preview"
                />

              ) : (

                <span>
                  👤
                </span>

              )}

            </div>

            <div className="profile-picture-info">

              <label>
                Profile Picture
              </label>

              <p>
                Choose a profile picture for this contact.
              </p>

              <label
                htmlFor="profile-picture"
                className="upload-picture-button"
              >

                Choose Picture

              </label>

              <input
                id="profile-picture"
                type="file"
                accept="image/*"
                onChange={handleProfilePicture}
                className="hidden-file-input"
              />

            </div>

          </div>

          {/* FIRST NAME */}

          <input
            type="text"
            name="first_name"
            placeholder="First Name"
            value={form.first_name}
            onChange={handleChange}
            required
          />

          {/* MIDDLE INITIAL */}

          <input
            type="text"
            name="middle_initial"
            placeholder="Middle Initial (Optional)"
            value={form.middle_initial}
            onChange={handleChange}
            maxLength="2"
          />

          {/* LAST NAME */}

          <input
            type="text"
            name="last_name"
            placeholder="Last Name"
            value={form.last_name}
            onChange={handleChange}
            required
          />

          {/* PHONE */}

          <div className="phone-section">

            <label>
              Phone Number
            </label>

            <div className="phone-controls">

              <select
                value={selectedCountry}
                onChange={(e) =>
                  setSelectedCountry(
                    e.target.value
                  )
                }
                className="country-select"
                required
              >

                {countries.map((country) => (

                  <option
                    key={country.code}
                    value={country.code}
                  >

                    {country.name}
                    {" "}
                    (+{country.callingCode})

                  </option>

                ))}

              </select>

              <input
                type="tel"
                name="phone"
                placeholder="Phone Number"
                value={form.phone}
                onChange={handleChange}
                required
              />

            </div>

          </div>

          {/* PERSONAL EMAIL */}

          <input
            type="email"
            name="personal_email"
            placeholder="Personal Email"
            value={form.personal_email}
            onChange={handleChange}
            required
          />

          {/* WORK EMAIL */}

          <input
            type="email"
            name="email"
            placeholder="Work Email (Optional)"
            value={form.email}
            onChange={handleChange}
          />

          {/* ADDRESS */}

          <div className="address-section">

            <label>
              Address / Location
            </label>

            <div className="address-controls">

              <input
                type="text"
                name="address"
                placeholder="Type address or pin a location"
                value={form.address}
                onChange={handleChange}
                required
              />

              <button
                type="button"
                className="pin-button"
                onClick={() =>
                  setShowMap(true)
                }
              >

                📍 Pin Location

              </button>

            </div>

            <button
              type="button"
              className="current-location-button"
              onClick={useCurrentLocation}
              disabled={locationLoading}
            >

              {locationLoading
                ? "Getting location..."
                : "◎ Use My Current Location"}

            </button>

            {showMap && (

              <div className="map-container">

                <div className="map-header">

                  <div>

                    <h3>
                      Pin Exact Location
                    </h3>

                    <p>

                      Search for a place or
                      click directly on the map.

                    </p>

                  </div>

                  <button
                    type="button"
                    className="close-map-button"
                    onClick={() =>
                      setShowMap(false)
                    }
                  >

                    ×

                  </button>

                </div>

                <LocationMap

                  position={position}

                  setPosition={setPosition}

                  setAddress={(address) => {

                    setForm({

                      ...form,

                      address:
                        address

                    });

                  }}

                />

                {position && (

                  <div className="selected-location">

                    <span>
                      📍 Selected Location
                    </span>

                    {locationLoading ? (

                      <p>
                        Finding place name...
                      </p>

                    ) : (

                      <p>

                        {form.address ||
                          "Location selected"}

                      </p>

                    )}

                  </div>

                )}

                <button
                  type="button"
                  className="confirm-location-button"
                  onClick={confirmLocation}
                  disabled={
                    !position ||
                    locationLoading
                  }
                >

                  {locationLoading
                    ? "Finding Address..."
                    : "✓ Confirm Location"}

                </button>

              </div>

            )}

          </div>

          {/* ADD CONTACT */}

          <button type="submit">

            + Add Contact

          </button>

        </form>

      </div>

      {/* ==========================
          SUCCESS MODAL
      ========================== */}

      {showSuccess && (

        <div className="success-overlay">

          <div className="success-modal">

            <div className="success-icon">
              ✓
            </div>

            <h2>
              Contact Added Successfully!
            </h2>

            <p>

              The contact has been saved
              to your contact database.

            </p>

            <button
              className="success-button"
              onClick={() =>
                setShowSuccess(false)
              }
            >

              Done

            </button>

          </div>

        </div>

      )}

      {/* ==========================
          INVALID PHONE MODAL
      ========================== */}

      {showPhoneError && (

        <div className="phone-error-overlay">

          <div className="phone-error-modal">

            <div className="phone-error-icon">
              !
            </div>

            <h2>
              Invalid Phone Number
            </h2>

            <p>
              {phoneErrorMessage}
            </p>

            <p className="phone-error-hint">

              Make sure the number matches
              the selected country.

            </p>

            <button
              type="button"
              className="phone-error-button"
              onClick={() =>
                setShowPhoneError(false)
              }
            >

              Try Again

            </button>

          </div>

        </div>

      )}

      {/* ==========================
          DUPLICATE PHONE MODAL
      ========================== */}

      {showDuplicatePhone && (

        <div className="duplicate-phone-overlay">

          <div className="duplicate-phone-modal">

            <div className="duplicate-phone-icon">
              !
            </div>

            <h2>
              Phone Number Already Added
            </h2>

            <p>
              {duplicatePhoneMessage}
            </p>

            <p className="duplicate-phone-hint">

              Please use a different phone number.

            </p>

            <button
              type="button"
              className="duplicate-phone-button"
              onClick={() =>
                setShowDuplicatePhone(false)
              }
            >

              Try Again

            </button>

          </div>

        </div>

      )}

      <footer id="build">
        Phase 6 Update - Build 2
      </footer>

    </div>

  );

}

// ==========================
// CONTACTS PAGE
// ==========================

function Contacts() {

  const [contacts, setContacts] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [searchResults, setSearchResults] =
    useState([]);

  const [showDeleteModal, setShowDeleteModal] =
    useState(false);

  const [contactToDelete, setContactToDelete] =
    useState(null);

  const getContacts = async () => {

    try {

      const response = await fetch(
        "/api/contacts/"
      );

      const data =
        await response.json();

      setContacts(data);

      setSearchResults(data);

    }

    catch (error) {

      alert(
        "Could not connect to the server."
      );

    }

  };

  useEffect(() => {

    getContacts();

  }, []);

  const handleSearch = () => {

    const searchText =
      search.toLowerCase().trim();

    if (searchText === "") {

      setSearchResults(
        contacts
      );

      return;

    }

    const results =
      contacts.filter((contact) => {

        const fullName =
          `${contact.first_name} ${contact.last_name}`
            .toLowerCase();

        return fullName.includes(
          searchText
        );

      });

    setSearchResults(results);

  };

  const clearSearch = () => {

    setSearch("");

    setSearchResults(
      contacts
    );

  };

  const openDeleteModal = (contact) => {

    setContactToDelete(contact);

    setShowDeleteModal(true);

  };

  const cancelDelete = () => {

    setShowDeleteModal(false);

    setContactToDelete(null);

  };

  const confirmDelete = async () => {

    if (!contactToDelete) {

      return;

    }

    const id =
      contactToDelete.id;

    try {

      const response = await fetch(

        `/api/contacts/${id}`,

        {
          method: "DELETE"
        }

      );

      if (!response.ok) {

        throw new Error(
          "Delete failed"
        );

      }

      const updatedContacts =
        contacts.filter(
          (contact) =>
            contact.id !== id
        );

      setContacts(
        updatedContacts
      );

      if (
        search.trim() === ""
      ) {

        setSearchResults(
          updatedContacts
        );

      }

      else {

        const searchText =
          search.toLowerCase().trim();

        const results =
          updatedContacts.filter(
            (contact) => {

              const fullName =
                `${contact.first_name} ${contact.last_name}`
                  .toLowerCase();

              return fullName.includes(
                searchText
              );

            }
          );

        setSearchResults(
          results
        );

      }

      setShowDeleteModal(false);

      setContactToDelete(null);

    }

    catch (error) {

      alert(
        "Could not delete the contact."
      );

    }

  };

  return (

    <div className="container">

      {/* NAVIGATION */}

      <div className="page-header">

        <div className="header-left">

          <Link
            to="/"
            className="back-button"
          >

            ← Back

          </Link>

          <Link
            to="/"
            className="logo-link"
          >

            Contact Manager

          </Link>

        </div>

        <Link to="/add-contact">

          <button className="nav-contacts-button">

            + Add Contact

          </button>

        </Link>

      </div>

      {/* HEADER */}

      <div className="contacts-header">

        <p className="section-label">

          CONTACT DATABASE

        </p>

        <h1>
          All Contacts
        </h1>

        <p className="section-description">

          Click a name to view the contact's information.

        </p>

      </div>

      {/* SEARCH */}

      <div className="search-section">

        <input
          type="text"
          className="search-input"
          placeholder="Search contact name..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          onKeyDown={(e) => {

            if (e.key === "Enter") {

              handleSearch();

            }

          }}
        />

        <button
          type="button"
          className="search-button"
          onClick={handleSearch}
        >

          🔍 Search

        </button>

        <button
          type="button"
          className="clear-search-button"
          onClick={clearSearch}
        >

          Clear

        </button>

      </div>

      {/* CONTACT LIST */}

      <div className="contact-list">

        {searchResults.length === 0 ? (

          <p className="no-contacts">

            No contacts found.

          </p>

        ) : (

          searchResults.map((contact) => (

            <div
              className="contact-name-card"
              key={contact.id}
            >

              <Link
                to={`/contacts/${contact.id}`}
                className="contact-name-link"
              >

                <div className="small-profile-picture">

                  {contact.profile_picture ? (

                    <img
                      src={
                        contact.profile_picture
                      }
                      alt="Profile"
                    />

                  ) : (

                    <span>
                      👤
                    </span>

                  )}

                </div>

                <span>

                  {contact.first_name}{" "}
                  {contact.middle_initial
                    ? `${contact.middle_initial} `
                    : ""}
                  {contact.last_name}

                </span>

                <span className="name-arrow">
                  →
                </span>

              </Link>

              <button
                className="delete-button"
                onClick={() =>
                  openDeleteModal(contact)
                }
              >

                Delete

              </button>

            </div>

          ))

        )}

      </div>

      {/* DELETE MODAL */}

      {showDeleteModal &&
        contactToDelete && (

        <div className="delete-overlay">

          <div className="delete-modal">

            <div className="delete-warning-icon">
              !
            </div>

            <h2>
              Are you sure?
            </h2>

            <p className="delete-message">

              Are you sure you want to delete this contact?

            </p>

            <p className="delete-contact-name">

              {contactToDelete.first_name}{" "}
              {contactToDelete.last_name}

            </p>

            <p className="delete-warning-text">

              This action cannot be undone.

            </p>

            <div className="delete-modal-buttons">

              <button
                type="button"
                className="cancel-delete-button"
                onClick={cancelDelete}
              >

                Cancel

              </button>

              <button
                type="button"
                className="confirm-delete-button"
                onClick={confirmDelete}
              >

                Delete

              </button>

            </div>

          </div>

        </div>

      )}

    </div>

  );

}

// ==========================
// CONTACT PROFILE
// ==========================

function ContactProfile() {

  const { id } =
    useParams();

  const [contact, setContact] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const getContact = async () => {

    try {

      const response = await fetch(

        `/api/contacts/${id}`

      );

      if (!response.ok) {

        setContact(null);

        return;

      }

      const data =
        await response.json();

      setContact(data);

    }

    catch (error) {

      console.error(error);

      setContact(null);

    }

    finally {

      setLoading(false);

    }

  };

  useEffect(() => {

    getContact();

  }, [id]);

  if (loading) {

    return (

      <div className="container">

        <p className="loading-text">

          Loading contact...

        </p>

      </div>

    );

  }

  if (!contact) {

    return (

      <div className="container">

        <div className="page-header">

          <Link
            to="/contacts"
            className="back-button"
          >

            ← Back to Contacts

          </Link>

        </div>

        <div className="no-contacts">

          Contact not found.

        </div>

      </div>

    );

  }

  return (

    <div className="container">

      <div className="page-header">

        <Link
          to="/contacts"
          className="back-button"
        >

          ← Back to Contacts

        </Link>

        <Link
          to="/"
          className="logo-link"
        >

          Contact Manager

        </Link>

      </div>

      <div className="profile-page">

        <div className="large-profile-picture">

          {contact.profile_picture ? (

            <img
              src={contact.profile_picture}
              alt="Profile"
            />

          ) : (

            <span>
              👤
            </span>

          )}

        </div>

        <p className="section-label">

          CONTACT PROFILE

        </p>

        <h1 className="profile-name">

          {contact.first_name}{" "}
          {contact.last_name}

        </h1>

        <div className="profile-information">

          <div className="profile-info-item">

            <span>
              PHONE
            </span>

            <p>

              {contact.phone ||
                "Not provided"}

            </p>

          </div>

          <div className="profile-info-item">

            <span>
              PERSONAL EMAIL
            </span>

            <p>
              {contact.personal_email ||
                "Not provided"}
            </p>

          </div>

          <div className="profile-info-item">

            <span>
              WORK EMAIL
            </span>

            <p>

              {contact.email ||
                "Not provided"}

            </p>

          </div>

          <div className="profile-info-item">

            <span>
              ADDRESS / LOCATION
            </span>

            <p>

              {contact.address ||
                "Not provided"}

            </p>

          </div>

        </div>

      </div>

    </div>

  );

}

// ==========================
// APP ROUTING
// ==========================

function App() {

  return (

    <BrowserRouter>

      <Routes>

        <Route
          path="/"
          element={<Welcome />}
        />

        <Route
          path="/add-contact"
          element={<Home />}
        />

        <Route
          path="/contacts"
          element={<Contacts />}
        />

        <Route
          path="/contacts/:id"
          element={<ContactProfile />}
        />

      </Routes>

    </BrowserRouter>

  );

}

export default App;
```
