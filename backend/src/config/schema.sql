-- Kullanıcılar tablosu
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('agent', 'quality_expert', 'manager')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Çağrılar tablosu
CREATE TABLE calls (
    id SERIAL PRIMARY KEY,
    agent_id INTEGER REFERENCES users(id),
    customer_phone VARCHAR(20),
    call_duration INTEGER, -- saniye cinsinden
    call_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    recording_path VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'evaluated', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Değerlendirme kriterleri tablosu
CREATE TABLE evaluation_criteria (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    max_score INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Değerlendirmeler tablosu
CREATE TABLE evaluations (
    id SERIAL PRIMARY KEY,
    call_id INTEGER REFERENCES calls(id),
    evaluator_id INTEGER REFERENCES users(id),
    total_score DECIMAL(5,2),
    notes TEXT,
    evaluation_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Değerlendirme detayları tablosu
CREATE TABLE evaluation_details (
    id SERIAL PRIMARY KEY,
    evaluation_id INTEGER REFERENCES evaluations(id),
    criteria_id INTEGER REFERENCES evaluation_criteria(id),
    score DECIMAL(5,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Varsayılan değerlendirme kriterlerini ekle
INSERT INTO evaluation_criteria (name, description, max_score) VALUES
    ('Açılış ve Karşılama', 'Müşteri temsilcisinin çağrıyı nasıl açtığı ve müşteriyi nasıl karşıladığı', 5),
    ('Etkin Dinleme ve Anlama', 'Müşteri temsilcisinin müşteriyi ne kadar iyi dinlediği ve anladığı', 15),
    ('Analiz ve Etkin Soru Sorma', 'Müşteri temsilcisinin sorunları analiz etme ve doğru sorular sorma becerisi', 15),
    ('Görüşme Kirliliği', 'Gereksiz kelimeler, tekrarlar ve doldurma ifadelerin kullanımı', 10),
    ('Ses Tonu', 'Ses tonu, vurgu ve konuşma hızı', 10),
    ('Sorunu Sahiplenme', 'Müşteri temsilcisinin sorunu ne kadar sahiplendiği', 5),
    ('Empati', 'Müşteriye karşı empati gösterme', 5),
    ('Süre ve Stres Yönetimi', 'Çağrı süresini ve stresi yönetme becerisi', 5),
    ('Doğru Yönlendirme', 'Müşteriyi doğru departmana yönlendirme', 10),
    ('Bilgiyi Paylaşma ve İkna', 'Bilgi paylaşımı ve ikna becerisi', 10),
    ('Kapanış Anonsu', 'Çağrıyı uygun şekilde kapatma', 5),
    ('Yönlendirilen Ekip Bilgisi', 'Yönlendirme yapılan ekibin bilgilerini doğru aktarma', 5); 