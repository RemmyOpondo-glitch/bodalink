//IMPORTS
const fs = require("fs");
const express = require("express");
const mysql = require("mysql2");
const session = require("express-session");
const bcrypt = require("bcrypt");
const multer = require("multer"); //for importing images from forms
const { FARE_PER_KM, contact, faqs, pages, pageUpdated } = require("./lib/content");

const app = express();
const port = 3001;

//DATABASE CONNECTION

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "bodalink",
});

db.connect((err) => {
  if (err) {
    console.log(err);
  } else {
    console.log("Database connected succesfully");

    // Newsletter signups are stored here. Created automatically so you don't have to re-run schema.sql.
    db.query(
      `CREATE TABLE IF NOT EXISTS newsletter_subscribers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(254) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      (tableErr) => {
        if (tableErr) console.log(tableErr);
      },
    );
  }
});

//Promise version of db.query, used by the newer async routes
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => (err ? reject(err) : resolve(results)));
  });
}

//MIDDLEWARE
app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true })); //read forms

app.use(express.static("public"));

app.use(
  session({
    secret: "bodalinksecret",
    resave: false,
    saveUninitialized: false,
  }),
);

//where multer will store the files
const storage = multer.diskStorage({
  destination: (req, file, cb)=>{
    cb(null, "public/uploads");
  },

  //giving the filename
  filename: (req, file, cb)=>{
    const uniqueName= Date.now() + "-" + file.originalname;

    cb(null,uniqueName);
  }

  
});
//filtering the profile image uploaded
const fileFilter = (req, file, cb)=>{
  if(
    file.mimetype === "image/jpeg"||
    file.mimetype === "image/png"||
    file.mimetype === "image/webp"
  ){
    cb(null,true);
  }
  else{
    const error = new Error("Only JPEG, PNG and WEBP images are allowed.");
    error.status = 400;
    cb(error);
  }
};

const upload = multer({
  storage:storage,
  fileFilter:fileFilter,
  limits:{fileSize:2*1024*1024} //limits to 2MB
})

//Runs the photo upload and shows upload problems on the sign-up form instead of crashing
function uploadProfilePhoto(req, res, next) {
  upload.single("profilePhoto")(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError || err.status === 400) {
      const message =
        err.code === "LIMIT_FILE_SIZE"
          ? "That photo is larger than 2 MB. Choose a smaller image."
          : err.message;
      return res.status(400).render("signup", { error: message });
    }

    next(err);
  });
}


//SHARED TEMPLATE VARIABLES (available in every view)
app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  res.locals.contact = contact;
  res.locals.fareRate = FARE_PER_KM;

  // Adds UTM tags to an outbound link. `placement` says where on the page the link sits.
  res.locals.utm = (url, placement) => {
    const link = new URL(url);
    if (!link.searchParams.has("utm_source")) {
      link.searchParams.set("utm_source", "bodalink");
      link.searchParams.set("utm_medium", "referral");
      link.searchParams.set(
        "utm_campaign",
        req.path.replace(/^\/+|\/+$/g, "").replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "home",
      );
      link.searchParams.set("utm_content", placement || "content");
    }
    return link.toString();
  };

  // Newsletter result after a no-JavaScript form post (?newsletter=success)
  const status = req.query.newsletter;
  res.locals.newsletterStatus = ["success", "invalid", "error"].includes(status) ? status : null;

  next();
});

//To make navbar available globally
app.use((req, res, next) => {

    res.locals.user = null;

    if (!req.session.userID) {
        return next();
    }

    db.query(
        "SELECT * FROM users WHERE id = ?",
        [req.session.userID],
        (err, results) => {

            if (err) {
                console.log(err);
                return next();
            }

            res.locals.user = results[0] || null;

            next();
        }
    );

});
//res.locals contains variables that EJS views can access.

//Old browsers ask for /favicon.ico by default
app.get("/favicon.ico", (req, res) => {
  res.redirect(301, "/favicon.svg");
});

//HOMEROUTES

app.get("/", (req, res, next) => {
  db.query("SELECT * FROM riders", (err, results) => {
    if (err) {
      return next(err);
    }

    res.render("home", {
      riders: results,
      faqs,
      updatedAt: pageUpdated.home,
    });
  });
});

//signup page
app.get("/signup", (req, res) => {
  res.render("signup");
});

app.post("/signup", uploadProfilePhoto, async (req, res, next) => {

  const { phone, password } = req.body;
  const profilePhoto= req.file ? req.file.filename :null; //Was a file uploaded? Yes → filename, No  → null 

  function removeUploadedFile() {
    if (req.file) fs.unlink(req.file.path, () => {});
  }

  if (typeof phone !== "string" || typeof password !== "string" || !phone.trim() || !password) {
    removeUploadedFile();
    return res.status(400).render("signup", {
      error: "Enter your phone number and a password.",
      phone: typeof phone === "string" ? phone : "",
    });
  }

  db.query(
    "SELECT * FROM users WHERE phone = ?",
    [phone],
    async (err, results) => {
      if (err) {
        removeUploadedFile();
        return next(err);
      }

      if (results.length > 0) {
        removeUploadedFile();
        return res.status(409).render("signup", {
          error: "That phone number is already registered. Try logging in instead.",
          phone,
        });
      }

      try {
        const hashedPassword = await bcrypt.hash(password, 10);

        db.query(
          "INSERT INTO users (phone, password, profile_photo) VALUES (?, ?, ?)",
          [phone, hashedPassword, profilePhoto],
          (err) => {
            if (err) {
              removeUploadedFile();
              return next(err);
            }

            res.redirect("/login");
          },
        );
      } catch (error) {
        removeUploadedFile();
        next(error);
      }
    },
  );
});

//Login page
app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res, next) => {
  const phone = req.body.phone;
  const password = req.body.password;

  //One message for "no such phone" and "wrong password" so nobody can probe which numbers have accounts
  const invalid = () =>
    res.status(401).render("login", {
      error: "Invalid phone number or password.",
      phone: typeof phone === "string" ? phone : "",
    });

  if (typeof phone !== "string" || typeof password !== "string") {
    return invalid();
  }

  db.query(
    "SELECT * FROM users WHERE phone= ?",
    [phone],

    async (err, results) => {
      if (err) {
        return next(err);
      }

      if (results.length === 0) {
        return invalid();
      }

      try {
        const user = results[0];
        const match = await bcrypt.compare(password, user.password);

        if (!match) {
          return invalid();
        }

        req.session.userID = user.id;

        res.redirect("/");
      } catch (error) {
        next(error);
      }
    },
  );
});

//Logout
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

//profile Route
app.get("/profile", (req, res, next) => {

    if (!req.session.userID) {
        return res.redirect("/login");
    }

    db.query(
        "SELECT * FROM users WHERE id = ?",
        [req.session.userID],
        (err, results) => {

            if (err) {
                return next(err);
            }

            if (results.length === 0) {
                return res.redirect("/login");
            }

            res.render("profile", {
                user: results[0]
            });

        }
    );

});


//Trips Route
app.get("/trips", (req, res) => {
  //protecting the routes
  if (!req.session.userID) {
    return res.redirect("/login");
  }

  res.render("trips");
});


// Booking Route
app.post("/book", (req, res, next) => {
  if (!req.session.userID) {
    return res.redirect("/login");
  }

  const { pickup, destination, distance,latitude,longitude } = req.body;
    console.log("Latitude:", latitude);
    console.log("Longitude:", longitude);

  
  ////Finding an available rider

  db.query(
    "SELECT * FROM riders WHERE available =TRUE LIMIT 1",
    (err, riderResults) => {
      if (err) return next(err);

      if (riderResults.length === 0) {
        return res.render("notice", {
          variant: "info",
          heading: "No riders available right now",
          message: "All riders are on a trip at the moment. Check the Riders page and try again in a few minutes.",
          details: [],
          actions: [
            { href: "/trips", label: "Try again", primary: true },
            { href: "/riders", label: "See riders" },
          ],
        });
      }

      const rider = riderResults[0]; //after the above querry result come in an array, this const is to help us take the specific rider in future by using rider.id

      //calculating the fare
      const fare = Number(distance) * FARE_PER_KM;
      //Number(distance) converts the string into a number thus enabling multiplication

      //saving the trip
      db.query(
        `INSERT INTO trips
                (user_id, rider_id, pickup, destination, distance, fare,status)
                VALUES (?,?,?,?,?,?,?)`,
        [
          req.session.userID,
          rider.id,
          pickup,
          destination,
          distance,
          fare,
          "pending",
        ],
        (err) => {
          if (err) return next(err);

          db.query(
            "UPDATE riders SET available=FALSE WHERE id=?",
            [rider.id],
            (err) => {
              if (err) return next(err);

              res.render("notice", {
                variant: "success",
                heading: "Ride booked",
                message: "Your rider has been assigned. Mark the trip complete in Trip History when you arrive.",
                details: [
                  { label: "Rider", value: rider.name },
                  { label: "Stage", value: rider.stage },
                  { label: "From", value: pickup },
                  { label: "To", value: destination },
                  { label: "Fare", value: "Ksh " + fare },
                ],
                actions: [
                  { href: "/history", label: "View trip history", primary: true },
                  { href: "/", label: "Home" },
                ],
              });


            },
          );
        },
      );
    },
  );
});

//Display Trip History
app.get("/history", (req, res, next) => {
  if (!req.session.userID) {
    return res.redirect("/login");
  }

  const sql = `SELECT
    trips.*, 
    riders.name AS rider_name,
    riders.stage
    FROM trips
    join riders
    ON trips.rider_id=riders.id
    WHERE trips.user_id=?
    ORDER BY trips.id DESC`;

  db.query(sql, [req.session.userID], (err, results) => {
    if (err) {
      return next(err);
    }

    //Adding statistics query
    const trips=results; //results of above query are stored in this trips because we want to run another query 
    
    db.query(
      `SELECT
      COUNT(*) AS totalTrips,
      SUM(fare) AS totalFare
    FROM trips
    WHERE user_id = ?`,
    [req.session.userID],
    (err,statsResult)=>{
      if(err){
        return next(err);
      }

      res.render("history",{
        trips:trips,
        stats:statsResult[0],
        updatedAt: new Date(),
      })
    }
    )
  });
});

app.get("/riders", (req, res, next) => {
  if (!req.session.userID) {
    return res.redirect("/login");
  }

  db.query("SELECT * FROM riders", (err, results) => {
    if (err) {
      return next(err);
    }

    res.render("riders", {
      riders: results,
      updatedAt: new Date(),
    });
  });
});


//Completing a trip.
//This changes data, so it is a POST (a GET link can be triggered by prefetching or by another site),
//and a trip can only be completed by the person who booked it.
app.post("/complete/:id", (req, res, next) => {
  if (!req.session.userID) {
    return res.redirect("/login");
  }

  const tripID = req.params.id;

  //finding the trip
  db.query(
    "SELECT * FROM trips WHERE id = ? AND user_id = ?",
    [tripID, req.session.userID],
    (err, results) => {
    if (err) {
      return next(err);
    }

    if (results.length === 0) {
      return next(Object.assign(new Error("We couldn't find that trip."), { status: 404 }));
    }

    const trip = results[0];

    //updating the trip
    db.query(
      "UPDATE trips SET status = ? WHERE id = ?",
      ["Completed", tripID],
      (err) => {
        if (err) {
          return next(err);
        }

        //updating the rider
        db.query(
          "UPDATE riders SET available = TRUE WHERE id = ?",
          [trip.rider_id],
          (err) => {
            if (err) {
              return next(err);
            }

            res.redirect("/history");
          },
        );
      },
    );
  });
});

//NEWSLETTER
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

//Only the path of the page the visitor came from is used, so this can never redirect to another site
function backPath(req) {
  try {
    const path = new URL(req.get("referer") || "/", "http://localhost").pathname;
    return path.replace(/\\/g, "/").replace(/^\/+/, "/");
  } catch (e) {
    return "/";
  }
}

app.post("/newsletter", async (req, res) => {
  const wantsJson = req.accepts(["html", "json"]) === "json";
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const trap = typeof req.body.website === "string" ? req.body.website : "";

  const reply = (statusCode, flag, message) => {
    if (wantsJson) {
      return res.status(statusCode).json({ ok: statusCode < 400, message });
    }
    res.redirect(303, `${backPath(req)}?newsletter=${flag}#newsletter`);
  };

  //bots fill the hidden field; they get a normal-looking success and nothing is saved
  if (trap) {
    return reply(200, "success", "You're subscribed.");
  }

  if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return reply(400, "invalid", "Enter a valid email address, like name@example.com.");
  }

  try {
    await query("INSERT INTO newsletter_subscribers (email) VALUES (?) ON DUPLICATE KEY UPDATE email = email", [email]);
    reply(200, "success", "You're subscribed.");
  } catch (err) {
    console.log(err);
    reply(500, "error", "Something went wrong on our side. Please try again.");
  }
});

//SEARCH
//Turns the typed text into up to 5 lowercase words
function searchTerms(raw) {
  const text = Array.isArray(raw) ? raw[0] : raw;
  if (typeof text !== "string") return { text: "", terms: [] };
  const cleaned = text.trim().slice(0, 100);
  const terms = cleaned
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 5)
    .map((term) => term.slice(0, 50));
  return { text: cleaned, terms };
}

//Escapes % and _ so they are searched as normal characters in LIKE
function likePattern(term) {
  return "%" + term.replace(/[\\%_]/g, "\\$&") + "%";
}

function scoreItem(item, terms) {
  const title = item.title.toLowerCase();
  const rest = (item.description + " " + (item.keywords || "")).toLowerCase();
  let score = 0;
  for (const term of terms) {
    const inTitle = title.includes(term);
    if (!inTitle && !rest.includes(term)) return 0; //every word must match somewhere
    score += inTitle ? 3 : 1;
  }
  return score;
}

async function runSearch(text, terms, userID) {
  const results = [];

  //Pages
  for (const page of pages) {
    const score = scoreItem(page, terms);
    if (score) {
      results.push({
        type: "Page",
        title: page.title,
        snippet: page.auth && !userID ? page.description + " (login required)" : page.description,
        url: page.url,
        score,
      });
    }
  }

  //FAQs
  for (const faq of faqs) {
    const score = scoreItem({ title: faq.question, description: faq.answer }, terms);
    if (score) {
      results.push({ type: "FAQ", title: faq.question, snippet: faq.answer, url: "/#" + faq.id, score });
    }
  }

  //Riders and trips are private to logged-in users, like their own pages
  if (userID) {
    const riderWhere = terms.map(() => "(name LIKE ? OR stage LIKE ?)").join(" AND ");
    const riderParams = terms.flatMap((term) => [likePattern(term), likePattern(term)]);
    const riders = await query(
      `SELECT name, stage, available FROM riders WHERE ${riderWhere} ORDER BY name LIMIT 10`,
      riderParams,
    );
    for (const rider of riders) {
      results.push({
        type: "Rider",
        title: rider.name,
        snippet: `${rider.stage} stage, ${rider.available ? "available" : "busy"}`,
        url: "/riders",
        score: 2,
      });
    }

    const tripWhere = terms
      .map(() => "(trips.pickup LIKE ? OR trips.destination LIKE ? OR riders.name LIKE ? OR trips.status LIKE ?)")
      .join(" AND ");
    const tripParams = terms.flatMap((term) => {
      const p = likePattern(term);
      return [p, p, p, p];
    });
    const trips = await query(
      `SELECT trips.pickup, trips.destination, trips.fare, trips.status, riders.name AS rider_name
       FROM trips JOIN riders ON trips.rider_id = riders.id
       WHERE trips.user_id = ? AND ${tripWhere}
       ORDER BY trips.id DESC LIMIT 10`,
      [userID, ...tripParams],
    );
    for (const trip of trips) {
      results.push({
        type: "Your trip",
        title: `${trip.pickup} to ${trip.destination}`,
        snippet: `Rider ${trip.rider_name}, Ksh ${trip.fare}, ${String(trip.status).toLowerCase()}`,
        url: "/history",
        score: 2,
      });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results;
}

//Used by the search box in the header (shows a few results as you type)
app.get("/api/search", async (req, res, next) => {
  try {
    const { text, terms } = searchTerms(req.query.q);
    if (text.length < 2) {
      return res.json({ query: text, total: 0, results: [] });
    }

    const found = await runSearch(text, terms, req.session.userID);
    res.set("Cache-Control", "no-store");
    res.json({
      query: text,
      total: found.length,
      results: found.slice(0, 8).map(({ type, title, snippet, url }) => ({ type, title, snippet, url })),
    });
  } catch (err) {
    next(err);
  }
});

//The full search results page
app.get("/search", async (req, res, next) => {
  try {
    const { text, terms } = searchTerms(req.query.q);
    const tooShort = text.length > 0 && text.length < 2;
    const found = text.length >= 2 ? await runSearch(text, terms, req.session.userID) : [];

    const labels = {
      Page: ["pages", "Pages"],
      FAQ: ["faqs", "Questions and answers"],
      Rider: ["riders", "Riders"],
      "Your trip": ["trips", "Your trips"],
    };
    const groups = Object.keys(labels)
      .map((type) => ({
        slug: labels[type][0],
        label: labels[type][1],
        items: found.filter((item) => item.type === type),
      }))
      .filter((group) => group.items.length > 0);

    res.render("search", { query: text, tooShort, total: found.length, groups });
  } catch (err) {
    next(err);
  }
});

//Makes sure error pages can always render the navbar, even if an error happened early
function ensureViewDefaults(res) {
  if (res.locals.user === undefined) res.locals.user = null;
}

//404: nothing above matched this address
app.use((req, res) => {
  ensureViewDefaults(res);
  res.status(404).render("404", { requestedPath: req.path.slice(0, 120) });
});

//Errors: log the details, show the visitor a friendly page (never the raw error)
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const status = Number(err.status || err.statusCode) || 500;
  console.log(err);
  ensureViewDefaults(res);

  if (status === 404) {
    return res.status(404).render("404", { requestedPath: req.path.slice(0, 120) });
  }

  res.status(status).render("error", {
    status,
    message:
      status < 500 && err.message
        ? err.message
        : "We hit a problem while loading this page. Please try again in a moment.",
  });
});

//START SERVER
app.listen(port, (req, res) => {
  console.log(`Server is listening to port ${port}`);
});
