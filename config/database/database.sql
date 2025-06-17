CREATE TABLE IF NOT EXISTS `devices` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `password` varchar(200) NOT NULL,
  `email` varchar(200) NOT NULL,
  `is_verified` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` date NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `sessions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `session_name` varchar(100) NOT NULL,
  `device_id` int(11) NOT NULL,
  `status` enum('disconnected','authenticated') NOT NULL DEFAULT 'disconnected',
  `status_qr` enum('ready','not_ready','qrReadSuccess','qrReadError','qrReadFail') NOT NULL DEFAULT 'not_ready',
  `qr_code` text DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `device_idFKS` (`device_id`),
  CONSTRAINT `device_idFKS` FOREIGN KEY (`device_id`) REFERENCES `devices` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `wa_group` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `session_id` int(11) NOT NULL,
  `name` varchar(200) NOT NULL,
  `waId` varchar(200) NOT NULL,
  `created_at` date NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_wa_session` (`waId`, `session_id`),
  KEY `sessions_id_FKWAG` (`session_id`),
  CONSTRAINT `sessions_id_FKWAG` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `messages_in_group` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_waGroup` int(11) NOT NULL,
  `message` text NOT NULL,
  `template_id` int(11) NOT NULL DEFAULT 0,
  `created_at` date NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `id_waGroup_ig` (`id_waGroup`),
  CONSTRAINT `id_waGroup_ig` FOREIGN KEY (`id_waGroup`) REFERENCES `wa_group` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `messages_in_personal` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `message_from` varchar(50) NOT NULL,
  `session_id` int(11) NOT NULL,
  `message` text NOT NULL,
  `template_id` int(11) NOT NULL,
  `created_at` date NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `sessions_idFKIP` (`session_id`),
  CONSTRAINT `sessions_idFKIP` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `messages_out_group` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_waGroup` int(11) NOT NULL,
  `message` text NOT NULL,
  `status` enum('send','failed') NOT NULL,
  `created_at` date NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `id_waGroup_og` (`id_waGroup`),
  CONSTRAINT `id_waGroup_og` FOREIGN KEY (`id_waGroup`) REFERENCES `wa_group` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `messages_out_personal` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `session_id` int(11) NOT NULL,
  `send_to` varchar(100) NOT NULL,
  `content` text NOT NULL,
  `status` enum('send','failed') NOT NULL,
  `created_at` date NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `sessions_idFKOP` (`session_id`),
  CONSTRAINT `sessions_idFKOP` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `template_message` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `session_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `key_message` text DEFAULT NULL,
  `message` text NOT NULL,
  `direction` enum('in','out') NOT NULL,
  `type` enum('personal','group') NOT NULL,
  `placeholder` varchar(500) DEFAULT NULL,
  `created_at` date NOT NULL DEFAULT current_timestamp(),
  `updated_at` date NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_idFKTM` (`session_id`),
  CONSTRAINT `sessions_idFKTM` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `tokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `device_id` int(11) NOT NULL,
  `token` varchar(255) NOT NULL,
  `token_type` enum('email_verification','password_reset') NOT NULL,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `device_id` (`device_id`),
  KEY `idx_tokens_token` (`token`),
  KEY `idx_tokens_expires_at` (`expires_at`),
  CONSTRAINT `tokens_ibfk_1` FOREIGN KEY (`device_id`) REFERENCES `devices` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;
