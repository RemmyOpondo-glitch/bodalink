// Single source of truth for site copy that is used in more than one place
// (home page, footer, floating contact button, site search).
// Edit values here and every page picks them up.

const FARE_PER_KM = 50; // Ksh per kilometre. Used by the server, the booking page and the home page estimator.

// These are the placeholder details that were already in the footer.
// Replace them with your real phone number and email address.
const contact = {
  phoneDisplay: "+254 700 000 000",
  phoneTel: "+254700000000",
  whatsapp: "254700000000",
  email: "support@bodalink.com",
  location: "Nairobi, Kenya",
};

const faqs = [
  {
    id: "faq-fare",
    question: "How much does a ride cost?",
    answer: `Fares are Ksh ${FARE_PER_KM} per kilometre. Enter your distance on the booking page, or in the fare estimator on the home page, and the fare is shown before you confirm.`,
  },
  {
    id: "faq-account",
    question: "Do I need an account to book?",
    answer:
      "Yes. Sign up with your phone number and a password, then log in to book. A profile photo is optional.",
  },
  {
    id: "faq-book",
    question: "How do I book a ride?",
    answer:
      "Open Book Ride, enter your pickup point, destination and distance, then choose Confirm & Book Ride. You can also use Get My Location to capture where you are.",
  },
  {
    id: "faq-rider",
    question: "Which rider will I get?",
    answer:
      "Your booking goes to the first available rider. The Riders page shows who is free and who is busy.",
  },
  {
    id: "faq-complete",
    question: "What should I do when my trip ends?",
    answer:
      "Open Trip History and choose Complete trip. This marks the ride as completed and frees the rider for the next passenger.",
  },
  {
    id: "faq-no-riders",
    question: "What if no riders are available?",
    answer:
      "You will see a message saying no riders are free right now. Check the Riders page and try again in a few minutes.",
  },
  {
    id: "faq-password",
    question: "Is my password safe?",
    answer:
      "Passwords are stored as one-way hashes, never as plain text, so nobody can read them back.",
  },
  {
    id: "faq-contact",
    question: "How do I contact BodaLink?",
    answer: `Call ${contact.phoneDisplay} or email ${contact.email}. The Contact us button at the bottom right of every page has both, plus WhatsApp.`,
  },
];

// Pages that site search can find. `auth: true` means the page needs a login.
const pages = [
  {
    title: "Home",
    url: "/",
    description: "Ride swiftly. Travel safely. Fare estimator, services and how booking works.",
    keywords: "home start welcome estimate fare calculator",
  },
  {
    title: "Book a ride",
    url: "/trips",
    description: "Enter your pickup, destination and distance, then confirm your booking.",
    keywords: "book booking request ride boda pickup destination distance location fare",
    auth: true,
  },
  {
    title: "Trip history",
    url: "/history",
    description: "Your past and active rides, total rides booked and total fare spent.",
    keywords: "trips history rides past complete completed status spent total",
    auth: true,
  },
  {
    title: "Riders",
    url: "/riders",
    description: "See which riders are available and which stage they work from.",
    keywords: "riders drivers available busy stage board",
    auth: true,
  },
  {
    title: "My profile",
    url: "/profile",
    description: "Your phone number and profile photo.",
    keywords: "profile account photo phone settings",
    auth: true,
  },
  {
    title: "Log in",
    url: "/login",
    description: "Log in to your BodaLink account.",
    keywords: "login log in sign in account password",
  },
  {
    title: "Sign up",
    url: "/signup",
    description: "Create a BodaLink account with your phone number.",
    keywords: "signup sign up register create account join",
  },
  {
    title: "Our services",
    url: "/#services",
    description: "Quick rides, parcel delivery and corporate mobility.",
    keywords: "services quick rides parcel delivery corporate business",
  },
  {
    title: "How booking works",
    url: "/#how-it-works",
    description: "Enter your trip, get matched with a rider, then complete the trip.",
    keywords: "how it works steps process booking match",
  },
  {
    title: "Safety",
    url: "/#safety",
    description: "Verified riders, safe journeys and reliable support.",
    keywords: "safety safe verified riders support secure trust",
  },
  {
    title: "Frequently asked questions",
    url: "/#faq",
    description: "Answers about fares, accounts, booking and contacting us.",
    keywords: "faq questions help answers support",
  },
  {
    title: "Contact us",
    url: "/#contact",
    description: `${contact.phoneDisplay}, ${contact.email}, ${contact.location}.`,
    keywords: "contact phone call email whatsapp support address location help",
  },
];

// "Last updated" dates for pages with written content (ISO dates, Africa/Nairobi).
// Change the date here whenever you edit that page's wording.
const pageUpdated = {
  home: "2026-10-20",
};

module.exports = { FARE_PER_KM, contact, faqs, pages, pageUpdated };
