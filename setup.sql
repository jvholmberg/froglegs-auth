/*
 Navicat Premium Data Transfer

 Source Server         : Localhost
 Source Server Type    : MariaDB
 Source Server Version : 110502 (11.5.2-MariaDB)
 Source Host           : localhost:3306
 Source Schema         : vajper_auth

 Target Server Type    : MariaDB
 Target Server Version : 110502 (11.5.2-MariaDB)
 File Encoding         : 65001

 Date: 24/03/2025 03:20:16
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for app
-- ----------------------------
DROP TABLE IF EXISTS `app`;
CREATE TABLE `app` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `slug` varchar(50) NOT NULL,
  `url` varchar(100) DEFAULT NULL,
  `name` varchar(50) DEFAULT NULL,
  `description` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- ----------------------------
-- Records of app
-- ----------------------------
BEGIN;
INSERT INTO `app` (`id`, `slug`, `url`, `name`, `description`) VALUES (1, 'centrumappen', 'http://localhost:3000', 'Centrumappen', 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.');
INSERT INTO `app` (`id`, `slug`, `url`, `name`, `description`) VALUES (2, 'clara_profile_fanhults', 'http://localhost:3000', 'Fanhults - Mina sidor', 'Mina sidor för Fanhults kunder');
INSERT INTO `app` (`id`, `slug`, `url`, `name`, `description`) VALUES (3, 'clara_profile_entremattan', 'http://localhost:3000', 'Entremattan - Mina sidor', 'Mina sidor för Entremattans kunder');
COMMIT;

-- ----------------------------
-- Table structure for app_invitation
-- ----------------------------
DROP TABLE IF EXISTS `app_invitation`;
CREATE TABLE `app_invitation` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `app_id` int(11) unsigned NOT NULL,
  `external_partition_id` int(11) unsigned DEFAULT NULL,
  `external_organization_id` int(11) unsigned DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `role_id` tinyint(3) unsigned DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`,`app_id`) USING BTREE,
  KEY `app_id` (`app_id`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `app_invitation_ibfk_1` FOREIGN KEY (`app_id`) REFERENCES `app` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `app_invitation_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- ----------------------------
-- Records of app_invitation
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for email_verification_request
-- ----------------------------
DROP TABLE IF EXISTS `email_verification_request`;
CREATE TABLE `email_verification_request` (
  `id` varchar(100) NOT NULL,
  `user_id` int(11) unsigned NOT NULL,
  `email` varchar(255) NOT NULL,
  `code` varchar(50) NOT NULL,
  `expires_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `email_verification_request_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- ----------------------------
-- Records of email_verification_request
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for password_reset_session
-- ----------------------------
DROP TABLE IF EXISTS `password_reset_session`;
CREATE TABLE `password_reset_session` (
  `id` varchar(100) NOT NULL,
  `user_id` int(11) unsigned NOT NULL,
  `email` varchar(255) NOT NULL,
  `code` varchar(50) NOT NULL,
  `expires_at` datetime NOT NULL,
  `email_verified` tinyint(1) NOT NULL DEFAULT 0,
  `two_factor_verified` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `password_reset_session_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- ----------------------------
-- Records of password_reset_session
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for role
-- ----------------------------
DROP TABLE IF EXISTS `role`;
CREATE TABLE `role` (
  `id` tinyint(4) unsigned NOT NULL AUTO_INCREMENT,
  `slug` varchar(20) NOT NULL,
  `rank` tinyint(4) unsigned NOT NULL,
  `name` varchar(20) DEFAULT NULL,
  `short_description` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- ----------------------------
-- Records of role
-- ----------------------------
BEGIN;
INSERT INTO `role` (`id`, `slug`, `rank`, `name`, `short_description`, `description`) VALUES (1, 'super_admin', 5, 'Super Admin', 'Full access + Extra', 'Det är endast Kaxig som skall ha denna behörigheten.');
INSERT INTO `role` (`id`, `slug`, `rank`, `name`, `short_description`, `description`) VALUES (2, 'admin', 4, 'Admin', 'Full access', 'Har access till allt.');
INSERT INTO `role` (`id`, `slug`, `rank`, `name`, `short_description`, `description`) VALUES (3, 'manager', 3, 'Manager', 'Access till det mesta', 'Denna behörigheten har access till mycket. Men vissa affärskritiska saker ligger utanför.');
INSERT INTO `role` (`id`, `slug`, `rank`, `name`, `short_description`, `description`) VALUES (4, 'user', 2, 'Användare', 'Vanlig access', 'Har nödvändig access för att utföra sina uppgifter men inte mer.');
INSERT INTO `role` (`id`, `slug`, `rank`, `name`, `short_description`, `description`) VALUES (5, 'guest', 1, 'Gäst', 'Minimal access', 'Kan komma åt vissa specifika saker. Eventuell så kan skrivrättigheter utelämnas mm.');
COMMIT;

-- ----------------------------
-- Table structure for session
-- ----------------------------
DROP TABLE IF EXISTS `session`;
CREATE TABLE `session` (
  `id` varchar(100) NOT NULL,
  `user_id` int(11) unsigned NOT NULL,
  `expires_at` datetime NOT NULL,
  `two_factor_verified` tinyint(1) NOT NULL DEFAULT 0,
  `ip_number` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `session_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- ----------------------------
-- Table structure for theme
-- ----------------------------
DROP TABLE IF EXISTS `theme`;
CREATE TABLE `theme` (
  `slug` varchar(20) NOT NULL,
  `header_logo_url` varchar(1000) DEFAULT NULL,
  `footer_logo_url` varchar(1000) DEFAULT NULL,
  `backdrop_url` varchar(1000) DEFAULT NULL,
  `alt_text` varchar(255) DEFAULT NULL,
  `header_logo_height` int(11) unsigned DEFAULT NULL,
  `header_logo_width` int(10) unsigned DEFAULT NULL,
  `footer_logo_height` int(11) DEFAULT NULL,
  `footer_logo_width` int(11) DEFAULT NULL,
  `backdrop_position` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- ----------------------------
-- Records of theme
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for user
-- ----------------------------
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `email_verified` tinyint(1) NOT NULL DEFAULT 0,
  `totp_key` blob DEFAULT NULL,
  `recovery_code` blob NOT NULL,
  `role_id` tinyint(4) unsigned DEFAULT 5,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`) USING BTREE,
  KEY `role_id` (`role_id`),
  CONSTRAINT `user_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- ----------------------------
-- Records of user
-- ----------------------------
BEGIN;
INSERT INTO `user` (`id`, `email`, `password_hash`, `email_verified`, `totp_key`, `recovery_code`, `role_id`) VALUES (1, 'info@kaxig.com', '$argon2id$v=19$m=19456,t=2,p=1$AdH5ENGttotuv4iDTIDCGg$s/Dsfaox9xH1WGY7qxAcuaQAj6Z1n73p7OII9Gn4Xx4', 1, NULL, 0x76BCAEB0379A586E00AC349D954F48C83328C085A7AD0CC1A3BB9BB23691D7FE33BAC2233CEFC068432CB1D8A0FD09DA, 1);
INSERT INTO `user` (`id`, `email`, `password_hash`, `email_verified`, `totp_key`, `recovery_code`, `role_id`) VALUES (2, 'johan@kaxig.com', '$argon2id$v=19$m=19456,t=2,p=1$37n19Ggfpej0j163IYIkdA$8N5HdnNNA8xAHXoo6CiwFXVqHjt12YyN4T8xgtj1wIc', 1, NULL, 0x4BB2B167B7332C7267D67B6F908A9475CDCA04CB9CFCB26AD2961C078A2EF88B92CC9A978C3D6E99BC1265BCD8BD79DB, 5);
COMMIT;

-- ----------------------------
-- Table structure for user_app
-- ----------------------------
DROP TABLE IF EXISTS `user_app`;
CREATE TABLE `user_app` (
  `user_id` int(11) unsigned NOT NULL,
  `app_id` int(11) unsigned NOT NULL,
  `role_id` tinyint(3) unsigned DEFAULT NULL,
  `external_partition_id` int(11) unsigned DEFAULT NULL,
  `external_organization_id` int(11) unsigned DEFAULT NULL,
  `external_id` int(11) unsigned DEFAULT NULL,
  PRIMARY KEY (`user_id`,`app_id`) USING BTREE,
  KEY `user_app_ibfk_2` (`app_id`),
  KEY `user_app_ibfk_3` (`role_id`),
  CONSTRAINT `user_app_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `user_app_ibfk_2` FOREIGN KEY (`app_id`) REFERENCES `app` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `user_app_ibfk_3` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`) ON DELETE SET NULL ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- ----------------------------
-- Records of user_app
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for user_details
-- ----------------------------
DROP TABLE IF EXISTS `user_details`;
CREATE TABLE `user_details` (
  `user_id` int(11) unsigned NOT NULL,
  `first_name` varchar(255) DEFAULT NULL,
  `last_name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `user_details_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- ----------------------------
-- View structure for view_external_app_role
-- ----------------------------
DROP VIEW IF EXISTS `view_external_app_role`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `view_external_app_role` AS select `role`.`id` AS `id`,`role`.`slug` AS `slug`,`role`.`rank` AS `rank`,`role`.`name` AS `name` from `role`;

-- ----------------------------
-- View structure for view_external_app_session
-- ----------------------------
DROP VIEW IF EXISTS `view_external_app_session`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `view_external_app_session` AS select `ses`.`id` AS `sessionId`,`ses`.`ip_number` AS `ipNumber`,`ses`.`expires_at` AS `expiresAt`,`usr`.`totp_key` is not null and `ses`.`two_factor_verified` = 1 or `usr`.`totp_key` is null AS `isVerified`,`app`.`slug` AS `appSlug`,`usr`.`id` AS `userId`,`rle`.`slug` AS `role`,`usa`.`external_partition_id` AS `partitionId`,`usa`.`external_organization_id` AS `organizationId`,`usa`.`external_id` AS `accountId` from ((((`user` `usr` join `session` `ses` on(`usr`.`id` = `ses`.`user_id`)) join `user_app` `usa` on(`usr`.`id` = `usa`.`user_id`)) join `role` `rle` on(`usa`.`role_id` = `rle`.`id`)) join `app` on(`usa`.`app_id` = `app`.`id`));

-- ----------------------------
-- View structure for view_external_app_user
-- ----------------------------
DROP VIEW IF EXISTS `view_external_app_user`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `view_external_app_user` AS select `usr`.`id` AS `id`,`app`.`id` AS `appId`,`app`.`slug` AS `appSlug`,`usr`.`email` AS `email`,`usa`.`external_partition_id` AS `partitionId`,`usa`.`external_organization_id` AS `organizationId`,`usa`.`external_id` AS `accountId`,`usd`.`first_name` AS `firstName`,`usd`.`last_name` AS `lastName`,`rle`.`slug` AS `role` from ((((`user_app` `usa` join `app` on(`usa`.`app_id` = `app`.`id`)) join `user` `usr` on(`usa`.`user_id` = `usr`.`id`)) left join `user_details` `usd` on(`usr`.`id` = `usd`.`user_id`)) left join `role` `rle` on(`usa`.`role_id` = `rle`.`id`));

SET FOREIGN_KEY_CHECKS = 1;
