# HIMAYA - IVR Flow Design

## Main Conversation Flow

```mermaid
stateDiagram-v2
    [*] --> Welcome
    Welcome --> LanguageSelect: Play greeting
    
    LanguageSelect --> MainMenu: Language chosen
    LanguageSelect --> LanguageSelect: Invalid input
    
    MainMenu --> SchemeSearch: "1" or "Schemes"
    MainMenu --> CheckEligibility: "2" or "Eligibility"
    MainMenu --> HelpLine: "3" or "Help"
    MainMenu --> MainMenu: Invalid input
    
    SchemeSearch --> CategorySelect: List categories
    CategorySelect --> SchemeList: Category chosen
    SchemeList --> SchemeDetails: Scheme selected
    SchemeDetails --> ApplyInfo: "How to apply"
    SchemeDetails --> SchemeList: "Back"
    ApplyInfo --> MainMenu: Complete
    
    CheckEligibility --> CollectInfo: Start
    CollectInfo --> ProcessEligibility: Info collected
    ProcessEligibility --> ShowResults: Calculate
    ShowResults --> SchemeDetails: Select scheme
    ShowResults --> MainMenu: "Back to menu"
    
    HelpLine --> TransferAgent: Request agent
    HelpLine --> MainMenu: "Back"
    
    MainMenu --> [*]: "Goodbye"
```

## Language Selection Flow

```mermaid
flowchart TD
    A[📞 Call Starts] --> B[🔊 Play: Welcome to HIMAYA]
    B --> C[🔊 Play: Press 1 for English<br/>Press 2 for Hindi<br/>हिंदी के लिए 2 दबाएं]
    C --> D{User Input}
    D -->|1| E[Set Language: English]
    D -->|2| F[Set Language: Hindi]
    D -->|Invalid| G[🔊 Invalid selection]
    G --> C
    E --> H[Main Menu]
    F --> H
```

## Voice Intent Recognition

```mermaid
flowchart LR
    subgraph "User Says"
        A1["What schemes are available?"]
        A2["Am I eligible for PM-KISAN?"]
        A3["How to apply for Ayushman Bharat?"]
        A4["मुझे योजनाओं के बारे में बताओ"]
    end

    subgraph "Detected Intent"
        B1[LIST_SCHEMES]
        B2[CHECK_ELIGIBILITY]
        B3[APPLY_INFO]
        B4[LIST_SCHEMES]
    end

    subgraph "Entities"
        C1[category: all]
        C2["scheme: PM-KISAN"]
        C3["scheme: Ayushman Bharat"]
        C4[category: all, lang: hi]
    end

    A1 --> B1 --> C1
    A2 --> B2 --> C2
    A3 --> B3 --> C3
    A4 --> B4 --> C4
```

## Eligibility Check Conversation

```mermaid
sequenceDiagram
    participant U as User
    participant S as System

    S->>U: What is your age?
    U->>S: I am 45 years old
    Note right of S: Extracted: age=45
    
    S->>U: What is your annual income?
    U->>S: About 2 lakh rupees
    Note right of S: Extracted: income=200000
    
    S->>U: Are you a farmer?
    U->>S: Yes, I have 2 acres
    Note right of S: Extracted: occupation=farmer, land=2
    
    S->>U: Do you have a BPL card?
    U->>S: Yes
    Note right of S: Extracted: bpl=true
    
    S->>U: Based on your profile, you are eligible for:<br/>1. PM-KISAN<br/>2. PM Fasal Bima Yojana<br/>3. Ayushman Bharat<br/>Say a number to learn more
```

## Error Handling Flow

```mermaid
flowchart TD
    A[User Input] --> B{Valid?}
    B -->|Yes| C[Process Input]
    B -->|No| D{Retry Count}
    D -->|< 3| E[🔊 I didn't understand.<br/>Please try again.]
    E --> A
    D -->|>= 3| F[🔊 Let me transfer you<br/>to an operator]
    F --> G[Transfer to Agent]
    
    C --> H{Network Error?}
    H -->|Yes| I[🔊 Connection issue.<br/>Please hold.]
    I --> J[Retry Request]
    J --> H
    H -->|No| K[Return Response]
```

## DTMF Keypad Mapping

| Key | Main Menu | Category Select | Scheme List |
|-----|-----------|-----------------|-------------|
| 1 | Browse Schemes | Agriculture | First scheme |
| 2 | Check Eligibility | Healthcare | Second scheme |
| 3 | Help/Support | Education | Third scheme |
| 4 | Change Language | Housing | Fourth scheme |
| 5 | - | Women & Child | Fifth scheme |
| 0 | Repeat Menu | Back | Back |
| * | Transfer to Agent | Transfer | Transfer |
| # | End Call | Main Menu | Main Menu |

## Sample Dialogues

### English - Scheme Inquiry
```
SYSTEM: Welcome to HIMAYA, your government scheme assistant.
        Press 1 for English. Hindi ke liye 2 dabaye.

USER:   1

SYSTEM: Main menu. Say "schemes" to browse schemes,
        "eligibility" to check what you qualify for,
        or "help" for assistance.

USER:   What schemes are available for farmers?

SYSTEM: I found 5 schemes for farmers:
        1. PM-KISAN - Direct income support of 6000 per year
        2. PM Fasal Bima - Crop insurance scheme
        3. Kisan Credit Card - Easy agricultural loans
        Say a number to learn more, or say "back" for main menu.

USER:   Tell me about PM-KISAN

SYSTEM: PM-KISAN provides 6000 rupees per year to farmer families,
        paid in 3 installments. To apply, you need:
        - Aadhaar card
        - Land ownership documents
        - Bank account
        Visit your nearest CSC center or apply online at pmkisan.gov.in
        Say "eligibility" to check if you qualify, or "back" for more schemes.
```

### Hindi - Eligibility Check
```
SYSTEM: हिमाया में आपका स्वागत है।
        कृपया अपनी भाषा चुनें। English के लिए 1, हिंदी के लिए 2 दबाएं।

USER:   2

SYSTEM: मुख्य मेनू। योजनाएं देखने के लिए "योजनाएं" बोलें,
        पात्रता जांचने के लिए "पात्रता" बोलें।

USER:   मेरी पात्रता जांचें

SYSTEM: मैं आपकी पात्रता जांचने में मदद करूंगा।
        कृपया अपनी उम्र बताएं।

USER:   पैंतालीस साल

SYSTEM: आपकी वार्षिक आय कितनी है?

USER:   दो लाख के करीब

SYSTEM: क्या आप किसान हैं?

USER:   हां, मेरे पास दो एकड़ जमीन है

SYSTEM: आपकी जानकारी के आधार पर, आप इन योजनाओं के लिए पात्र हैं:
        1. पीएम-किसान - सालाना 6000 रुपये
        2. आयुष्मान भारत - 5 लाख का स्वास्थ्य बीमा
        अधिक जानने के लिए नंबर बोलें।
```
