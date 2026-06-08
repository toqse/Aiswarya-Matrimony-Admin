"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const clauses = [
  "M/s Aiswarya Vivaha Bureau is furnishing the following details for your information and further clarification- (proposals, and other concerned details is also added to this information)",
  "As per the rules and regulations of Aiswarya Vivaha Bureau, if you remit to the fees properly at the time of entrance you can select or choose the information from our office (Downloading)",
  "Genuine information can be collected from our office and if you use this information on any malpractice or misuse, definitely it is illegal and immoral. In such a situation you will face disciplinary action or legal steps from the institution.",
  "If you select any proposal according to your taste and preference, no change will be possible thereafter.",
  "At the time of your submission of information, if any error or mistake or confusion (Groom / Bride) occurs, the full responsibility lies with either the Bride party or the Groom party.",
  "Our reputed institution has been operating for more than 39 years with perfect operation and a sincere, responsible attitude towards the parties we serve.",
  "M/s Aiswarya Vivaha Bureau charges Rs. 10,000/- from Bride and Rs. 15,000/- from Groom as service charge. Our staff will provide full support throughout the process. We do not collect any additional or unauthorized amounts — this is an outstanding merit of our institution.",
  "For any complaint or false information from our institution, we will take necessary steps to avoid such mistakes and provide suitable remedy. You can contact our customer cell number.",
  "If any mistake or illegal activities occur from the part of our institution regarding selected marriage proposals, legal proceedings will be taken in Cherthala Legal Jurisdiction.",
  "We have a number of branches across Kerala. You can visit our website to collect information and send your proposal to any branch. Our full support and follow-up is our basic obligation.",
];

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-6xl w-full">
          {/* Logo */}
          <div className="text-center mb-4">
            <img
              src="/images/WhatsApp_Image_2026-03-04_at_10.28.26_AM-removebg-preview.png"
              alt="Aiswarya Vivaha Bureau - 39 Years of Trust & Tradition"
              className="mx-auto max-h-32 w-auto object-contain"
            />
          </div>

          {/* Title */}
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-black text-center uppercase tracking-tight mb-2">
            Terms and Conditions
          </h1>
          <div className="w-24 h-0.5 bg-primary mx-auto mb-10" />

          {/* Clauses */}
          <ol className="terms-list space-y-5 list-decimal list-outside text-black text-base sm:text-lg leading-relaxed w-full pl-8 sm:pl-10">
            {clauses.map((text, i) => (
              <li key={i} className="w-full">
                <span>{text}</span>
              </li>
            ))}
          </ol>

          {/* Footer line */}
          <p className="text-center text-sm text-muted-foreground mt-12 pt-8 border-t border-primary/10">
          Aiswarya Vivaha Bureau | 39 Years of Trust & Tradition
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsPage;
