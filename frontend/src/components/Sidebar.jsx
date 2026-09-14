import React from "react";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";


/*
|--------------------------------------------------------------------------
| ROLE MENUS
|--------------------------------------------------------------------------
*/

const roleMenus = {
  student: [
    {
      key: "overview",
      label: "Dashboard",
      icon: "⌂",
    },

    {
      key: "academic-records",
      label: "Academic Records",
      icon: "▣",
    },

    {
      key: "schedule",
      label: "My Schedule",
      icon: "◷",
    },

    {
      key: "reports",
      label: "Reports",
      icon: "▤",
    },

    {
      key: "notifications",
      label: "Notifications",
      icon: "◉",
    },

    {
      key: "messages",
      label: "Messages",
      icon: "💬",
    },

    {
      key: "tasks",
      label: "My Tasks",
      icon: "✓",
    },

    {
      key: "profile",
      label: "My Profile",
      icon: "♙",
    },
  ],


  mentor: [
    {
      key: "overview",
      label: "Dashboard",
      icon: "⌂",
    },

    {
      key: "students",
      label: "My Students",
      icon: "♙",
    },

    {
      key: "performance",
      label: "Student Performance",
      icon: "▥",
    },

    {
      key: "sessions",
      label: "Mentoring Sessions",
      icon: "◷",
    },

    {
      key: "messages",
      label: "Messages",
      icon: "💬",
    },

    {
      key: "reports",
      label: "Reports",
      icon: "▤",
    },

    {
      key: "profile",
      label: "My Profile",
      icon: "♙",
    },
  ],


  hod: [
    {
      key: "overview",
      label: "Dashboard",
      icon: "⌂",
    },

    {
    key: "analytics",
    label: "Department Analytics",
    icon: "📊",
  },

    {
      key: "students",
      label: "Students",
      icon: "♙",
    },

    {
      key: "mentors",
      label: "Mentors",
      icon: "♟",
    },

    {
      key: "student-performance",
      label: "Student Performance",
      icon: "▥",
    },

    {
      key: "reports",
      label: "Reports",
      icon: "▤",
    },

    {
      key: "profile",
      label: "My Profile",
      icon: "♙",
    },
  ],
};


/*
|--------------------------------------------------------------------------
| ROLE NAMES
|--------------------------------------------------------------------------
*/

const roleNames = {
  student: "Student",
  mentor: "Mentor",
  hod: "Head of Department",
};


/*
|--------------------------------------------------------------------------
| SIDEBAR
|--------------------------------------------------------------------------
*/

export default function Sidebar({
  role = "student",
}) {

  const navigate = useNavigate();

  const location = useLocation();


  /*
  |--------------------------------------------------------------------------
  | GET ROLE MENU
  |--------------------------------------------------------------------------
  */

  const menus =
    roleMenus[role] ||
    roleMenus.student;


  /*
  |--------------------------------------------------------------------------
  | GET LOGGED-IN USER
  |--------------------------------------------------------------------------
  */

  let user = {};

  try {

    user = JSON.parse(
      localStorage.getItem(
        "mentorconnect_user"
      ) || "{}"
    );

  } catch (error) {

    user = {};

  }


  /*
  |--------------------------------------------------------------------------
  | USER NAME
  |--------------------------------------------------------------------------
  */

  const userName =
    user.name ||
    user.fullName ||
    user.username ||
    roleNames[role] ||
    "User";


  /*
  |--------------------------------------------------------------------------
  | USER INITIAL
  |--------------------------------------------------------------------------
  */

  const userInitial =
    userName
      .charAt(0)
      .toUpperCase();


  /*
  |--------------------------------------------------------------------------
  | ACTIVE MENU
  |--------------------------------------------------------------------------
  */

  const isActive = (key) => {

    const basePath =
      `/${role}`;


    if (key === "overview") {

      return (
        location.pathname ===
          basePath ||

        location.pathname ===
          `${basePath}/`
      );

    }


    return location.pathname.startsWith(
      `${basePath}/${key}`
    );

  };


  /*
  |--------------------------------------------------------------------------
  | NAVIGATION
  |--------------------------------------------------------------------------
  */

  const openPage = (key) => {

    if (key === "overview") {

      navigate(
        `/${role}`
      );

      return;

    }


    navigate(
      `/${role}/${key}`
    );

  };


  /*
  |--------------------------------------------------------------------------
  | LOGOUT
  |--------------------------------------------------------------------------
  */

  const logout = () => {

    const confirmed =
      window.confirm(
        "Are you sure you want to logout?"
      );


    if (!confirmed) {
      return;
    }


    /*
     * Current authentication
     */

    localStorage.removeItem(
      "mentorconnect_token"
    );

    localStorage.removeItem(
      "mentorconnect_user"
    );


    /*
     * Old authentication keys
     */

    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "user"
    );

    localStorage.removeItem(
      "authToken"
    );


    /*
     * Return to login
     */

    navigate(
      "/login",
      {
        replace: true,
      }
    );

  };


  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <aside className="mc-sidebar">


      {/* =====================================================
          BRAND
      ====================================================== */}

      <div className="mc-brand">

        <div className="mc-brand-icon">
          🎓
        </div>


        <div>

          <strong>
            Mentor
            <span>
              Connect
            </span>
          </strong>


          <small>
            Smart Mentoring System
          </small>

        </div>

      </div>


      {/* =====================================================
          USER
      ====================================================== */}

      <div className="mc-sidebar-user">

        <div className="mc-sidebar-avatar">
          {userInitial}
        </div>


        <div className="mc-sidebar-user-info">

          <strong>
            {userName}
          </strong>


          <small>
            {roleNames[role]}
          </small>

        </div>

      </div>


      {/* =====================================================
          WORKSPACE
      ====================================================== */}

      <div className="mc-sidebar-section">

        <span className="mc-sidebar-heading">
          WORKSPACE
        </span>


        <nav className="mc-side-nav">

          {menus.map(
            (item) => (

              <button
                key={item.key}
                type="button"
                className={
                  isActive(
                    item.key
                  )
                    ? "mc-side-link active"
                    : "mc-side-link"
                }
                onClick={() =>
                  openPage(
                    item.key
                  )
                }
              >

                <span className="mc-side-icon">
                  {item.icon}
                </span>


                <span className="mc-side-label">
                  {item.label}
                </span>

              </button>

            )
          )}

        </nav>

      </div>


      {/* =====================================================
          SYSTEM
      ====================================================== */}

      <div className="mc-side-bottom">

        <span className="mc-sidebar-heading">
          SYSTEM
        </span>


        {/* SETTINGS */}

        <button
          type="button"
          className="mc-side-link"
          onClick={() =>
            navigate(
              `/${role}/profile`
            )
          }
        >

          <span className="mc-side-icon">
            ⚙
          </span>


          <span className="mc-side-label">
            Settings
          </span>

        </button>


        {/* LOGOUT */}

        <button
          type="button"
          className="mc-side-link mc-logout"
          onClick={logout}
        >

          <span className="mc-side-icon">
            ↪
          </span>


          <span className="mc-side-label">
            Logout
          </span>

        </button>

      </div>


      {/* =====================================================
          VERSION
      ====================================================== */}

      <div className="mc-sidebar-version">
        MentorConnect v1.0
      </div>

    </aside>
  );
}