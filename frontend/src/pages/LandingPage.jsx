import React from "react";
import { useNavigate } from "react-router-dom";

const roles = [
  {
    role: "student",
    title: "Student Dashboard",
    text: "Track your academic performance and mentoring progress.",
    icon: "🎓",
    cls: "green",
  },

  {
    role: "mentor",
    title: "Mentor Dashboard",
    text: "Manage students, mentoring sessions, follow-ups and guidance.",
    icon: "👥",
    cls: "orange",
  },

  {
    role: "hod",
    title: "HOD Dashboard",
    text: "Monitor department performance, student progress and mentor activities.",
    icon: "🏫",
    cls: "blue",
  },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing">

      {/* =====================================================
          HERO
      ====================================================== */}

      <section className="hero">

        <header className="landing-nav">

          <div className="landing-brand">

            <div className="cap">
              🎓
            </div>

            <div>
              <strong>
                Mentor
                <span>Connect</span>
              </strong>

              <small>
                Smart Mentoring System
              </small>
            </div>

          </div>


          <nav>
            <a href="#home">
              Home
            </a>

            <a href="#features">
              Features
            </a>

            <a href="#about">
              About
            </a>

            <a href="#how-it-works">
              How It Works
            </a>

            <a href="#contact">
              Contact
            </a>
          </nav>


          <div className="nav-buttons">

            <button
              className="outline-btn"
              onClick={() =>
                navigate("/login")
              }
            >
              Login
            </button>

            <button
              className="white-btn"
              onClick={() =>
                navigate("/register")
              }
            >
              Register
            </button>

          </div>

        </header>


        {/* =================================================
            HERO CONTENT
        ================================================== */}

        <div
          className="hero-content"
          id="home"
        >

          <div className="hero-copy">

            <div className="eyebrow welcome">
              WELCOME TO MENTORCONNECT
            </div>

            <h1>
              Empowering Students
              <br />
              Connecting Mentors
              <br />
              Building Better Futures
            </h1>

            <p>
              A smart mentoring platform
              that connects students,
              mentors and institutions
              to collaborate, learn and
              grow together.
            </p>


            <div className="hero-actions">

              <button
                className="primary-btn"
                onClick={() =>
                  navigate("/login")
                }
              >
                Get Started
              </button>

              <a
                className="learn-btn"
                href="#features"
              >
                Learn More
              </a>

            </div>

          </div>


          <div className="hero-visual">

            <div className="photo-frame">

              <img
                src="/education-study.jpg"
                alt="Student studying with books and laptop"
              />

            </div>

          </div>

        </div>


        {/* =================================================
            HERO FEATURES
        ================================================== */}

        <div
          className="hero-features"
          id="features"
        >

          <div>
            <span>🎓</span>
            <b>For Students</b>
            <small>
              Track progress and academic performance
            </small>
          </div>


          <div>
            <span>👨‍🏫</span>
            <b>For Mentors</b>
            <small>
              Guide students and manage mentoring
            </small>
          </div>


          <div>
            <span>📊</span>
            <b>Performance Tracking</b>
            <small>
              Monitor progress and achievements
            </small>
          </div>


          <div>
            <span>📈</span>
            <b>Smart Analytics</b>
            <small>
              Data-driven insights for better decisions
            </small>
          </div>

        </div>

      </section>


      {/* =====================================================
          DASHBOARDS
      ====================================================== */}

      <section
        className="dashboard-section"
        id="dashboards"
      >

        <div className="section-heading">

          <span>
            EXPLORE YOUR WORKSPACE
          </span>

          <h2>
            One Platform. Three Powerful Dashboards.
          </h2>

          <p>
            Choose your role to access
            your dedicated dashboard.
          </p>

        </div>


        <div className="role-grid">

          {roles.map(
            (item) => (

              <article
                className={`role-card ${item.cls}`}
                key={item.role}
              >

                <div className="role-icon">
                  {item.icon}
                </div>

                <h3>
                  {item.title}
                </h3>

                <p>
                  {item.text}
                </p>

                <button
                  onClick={() =>
                    navigate(
                      `/${item.role}`
                    )
                  }
                >
                  Access Dashboard
                  <span>→</span>
                </button>

              </article>

            )
          )}

        </div>

      </section>


      {/* =====================================================
          ABOUT
      ====================================================== */}

      <section
        className="about-section"
        id="about"
      >

        <div>

          <span className="eyebrow dark">
            WHY MENTORCONNECT?
          </span>

          <h2>
            Everything your institution
            needs in one place.
          </h2>

          <p className="about-lead">
            A simple and organized
            platform for students,
            mentors and academic
            administrators.
          </p>

        </div>


        <div className="about-grid">

          <div>
            <b>
              📊 Analytics
            </b>

            <p>
              Clear academic insights
              for better decisions.
            </p>
          </div>


          <div>
            <b>
              🗓️ Scheduling
            </b>

            <p>
              Manage mentoring meetings
              and important dates.
            </p>
          </div>


          <div>
            <b>
              🔔 Notifications
            </b>

            <p>
              Keep students and staff
              updated.
            </p>
          </div>


          <div>
            <b>
              🔐 Role Based Access
            </b>

            <p>
              Dedicated workspaces for
              every role.
            </p>
          </div>

        </div>

      </section>


      {/* =====================================================
          HOW IT WORKS
      ====================================================== */}

      <section
        className="how-section"
        id="how-it-works"
      >

        <span className="eyebrow dark">
          HOW IT WORKS
        </span>

        <h2>
          Simple. Connected. Effective.
        </h2>


        <div className="steps">

          <div>
            <strong>
              01
            </strong>

            <b>
              Choose your role
            </b>

            <p>
              Student, Mentor or HOD.
            </p>
          </div>


          <div>
            <strong>
              02
            </strong>

            <b>
              Access your dashboard
            </b>

            <p>
              Use the tools designed
              for your responsibilities.
            </p>
          </div>


          <div>
            <strong>
              03
            </strong>

            <b>
              Track and improve
            </b>

            <p>
              Monitor performance,
              activities and progress.
            </p>
          </div>

        </div>

      </section>


      {/* =====================================================
          FOOTER
      ====================================================== */}

      <footer id="contact">

        <b>
          MentorConnect
        </b>

        <span>
          Smart Mentoring System • Academic Hub
        </span>

      </footer>

    </div>
  );
}