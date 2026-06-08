// Religion -> Caste options for filtering (sample; extend as needed)
export const RELIGION_CASTE_MAP: Record<string, string[]> = {
  Hindu: [
    "Ambalavasi", "Arya", "Bharather", "Blacksmith", "Brahmin", "Carpenter", "Cast No Bar", "Cheramar",
    "Dheevara", "Ezhava", "Ezhavathy", "Ezhu Thachan", "Ganaka", "Goldsmith", "Hindu Nadar", "Inter Caste",
    "Iyar", "Kaimal", "Kartha", "Kudumbi", "Kurup", "Maison", "Mannan", "Marar", "Menon", "Nadar", "Nair",
    "Nambiar", "Nambudhiri", "Panan", "Panikkar", "Paravar", "Pattaya", "Paraya", "Pathiyan", "Potty",
    "Pilla", "Thiruvannan", "Puliya", "Saiva Vellala", "Saliya", "Sambava", "Siddhnath", "Tamil Chettiar",
    "Thiya", "Tulu Brahmin", "Ulladan", "Unni", "Vaniya", "Vishaka", "Veerashaiva", "Vellala", "Veera Shiva Vallala",
    "Velan", "Veluthedath Nair", "Vil Kurup", "Other",
  ],
  Muslim: ["Ahmediya", "Anaphy", "Islam", "Mappila", "Muhamediya", "Shafi", "Shiya", "Sunni", "Other"],
  Christian: [
    "Anglo-Indian Christian", "Brethren", "Chaldean Syrian", "Cheramar Christian", "CSI (Church of South India)",
    "CSI – Chaldean", "Evangelical", "Jacobite Syrian Orthodox", "Knanaya", "Latin Catholic", "Malankara Orthodox Syrian",
    "Mar Thoma", "Nadar Christian", "Orthodox Syrian", "Pentecostal", "Protestant", "Roman Catholic", "Seventh-day Adventist",
    "Syrian Catholic", "Syro-Malabar Catholic", "Syro-Malankara Catholic", "Other",
  ],
  Sikh: ["Jat", "Khatri", "Ramgarhia", "Other"],
  Buddhist: ["Mahayana", "Theravada", "Other"],
  Jain: ["Digambar", "Shwetambar", "Other"],
  Other: ["Other"],
  "Caste no bar": [],
  Intercaste: [],
};

export const MOTHER_TONGUES = ["Tamil", "Telugu", "Kannada", "Malayalam", "Hindi", "English", "Urdu", "Bengali", "Marathi", "Gujarati", "Punjabi", "Other"];
