"use client";

import classNames from "classnames/bind";
import Link from "next/link";
import React, { useState } from "react";
import styles from "./Header.module.css";

const cx = classNames.bind(styles);

const Header = () => {
  const [mobileNavOpen, setMobileNav] = useState(false);
  const links = [
    { label: "Work", url: "/#projects" },
    { label: "About", url: "/#about" },
    { label: "Contact", url: "/#contact" },
  ];

  return (
    <header className={styles.header}>
      <nav className={cx(styles.navContainer, { mobileNavOpen })}>
        {links.map(({ label, url }) => (
          <Link
            key={`nav-${label}`}
            type="button"
            className={styles.navLink}
            href={url}
            onClick={() => setMobileNav(false)}
          >
            {label}
          </Link>
        ))}
      </nav>

      <button
        className={styles.mobileNavButton}
        onClick={() => setMobileNav(!mobileNavOpen)}
        aria-label="Open Navigation"
      >
        <div
          className={cx(styles.hamburgerIcon, { closeIcon: mobileNavOpen })}
        />
      </button>
    </header>
  );
};

export default Header;
