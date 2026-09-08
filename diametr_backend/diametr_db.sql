-- MySQL dump 10.13  Distrib 8.0.40, for Win64 (x86_64)
--
-- Host: localhost    Database: diametr_db
-- ------------------------------------------------------
-- Server version	8.0.40

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `ad`
--

DROP TABLE IF EXISTS `ad`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ad` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subtitle` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expired` datetime(3) DEFAULT NULL,
  `shop_id` int DEFAULT NULL,
  `region_id` int DEFAULT NULL,
  `type` enum('SHOP','WORKER','REGION','PRODUCT') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `work_status` enum('WORKING','BLOCKED','DELETED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'WORKING',
  `product_id` int DEFAULT NULL,
  `worker_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `Ad_shop_id_fkey` (`shop_id`),
  KEY `Ad_region_id_fkey` (`region_id`),
  KEY `Ad_product_id_fkey` (`product_id`),
  KEY `Ad_worker_id_fkey` (`worker_id`),
  CONSTRAINT `Ad_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Ad_region_id_fkey` FOREIGN KEY (`region_id`) REFERENCES `region` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Ad_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `shop` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Ad_worker_id_fkey` FOREIGN KEY (`worker_id`) REFERENCES `worker` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ad`
--

LOCK TABLES `ad` WRITE;
/*!40000 ALTER TABLE `ad` DISABLE KEYS */;
INSERT INTO `ad` VALUES (1,'yozgi reklama',NULL,NULL,'2026-01-01 00:00:00.000',4,NULL,'SHOP','2025-07-09 14:55:07.332','2025-07-09 14:55:07.332','WORKING',NULL,NULL);
/*!40000 ALTER TABLE `ad` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admin`
--

DROP TABLE IF EXISTS `admin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fullname` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('ADMIN','SUPER','USER','WORKER') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ADMIN',
  `createdt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `chat_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shop_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Admin_phone_key` (`phone`),
  KEY `Admin_shop_id_fkey` (`shop_id`),
  CONSTRAINT `Admin_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `shop` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin`
--

LOCK TABLES `admin` WRITE;
/*!40000 ALTER TABLE `admin` DISABLE KEYS */;
INSERT INTO `admin` VALUES (1,'Sherzod Ibrahimov',NULL,'+998970461290','00060697','ADMIN','2025-07-08 13:35:17.821','2025-07-08 13:35:17.821',NULL,13),(2,'Madadbek Usmonov',NULL,'+998970461291','88953956','ADMIN','2025-07-08 13:35:35.706','2025-07-08 13:37:43.255',NULL,13);
/*!40000 ALTER TABLE `admin` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `category`
--

DROP TABLE IF EXISTS `category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `category` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `desc` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `work_status` enum('WORKING','BLOCKED','DELETED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'WORKING',
  `createdt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `category`
--

LOCK TABLES `category` WRITE;
/*!40000 ALTER TABLE `category` DISABLE KEYS */;
INSERT INTO `category` VALUES (2,'Bo\'yoqlar','Bo\'yoqlar haqida izoh',NULL,'WORKING','2025-07-08 14:43:50.625','2025-07-08 14:43:50.625'),(3,'Ichimlik','Ichimlik suvlari',NULL,'WORKING','2025-07-10 10:28:17.523','2025-07-10 10:28:17.523');
/*!40000 ALTER TABLE `category` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `new`
--

DROP TABLE IF EXISTS `new`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `new` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` text COLLATE utf8mb4_unicode_ci,
  `subtitle` text COLLATE utf8mb4_unicode_ci,
  `image` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expired` datetime(3) DEFAULT NULL,
  `createdt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `work_status` enum('WORKING','BLOCKED','DELETED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'WORKING',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `new`
--

LOCK TABLES `new` WRITE;
/*!40000 ALTER TABLE `new` DISABLE KEYS */;
INSERT INTO `new` VALUES (1,'Yozgi aksiya updated','Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',NULL,'2025-09-15 00:00:00.000','2025-07-08 14:27:46.245','2025-07-08 14:29:18.031','WORKING');
/*!40000 ALTER TABLE `new` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order`
--

DROP TABLE IF EXISTS `order`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order` (
  `id` int NOT NULL AUTO_INCREMENT,
  `status` enum('STARTED','FINISHED','CANCELED','CONFIRMED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'STARTED',
  `user_id` int DEFAULT NULL,
  `shop_id` int DEFAULT NULL,
  `lat` double DEFAULT NULL,
  `lon` double DEFAULT NULL,
  `amount` int DEFAULT NULL,
  `delivery_type` enum('YANDEX','MARKET','FIXED') COLLATE utf8mb4_unicode_ci DEFAULT 'MARKET',
  `createdt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `work_status` enum('WORKING','BLOCKED','DELETED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'WORKING',
  `desc` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `Order_user_id_fkey` (`user_id`),
  KEY `Order_shop_id_fkey` (`shop_id`),
  CONSTRAINT `Order_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `shop` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Order_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order`
--

LOCK TABLES `order` WRITE;
/*!40000 ALTER TABLE `order` DISABLE KEYS */;
INSERT INTO `order` VALUES (1,'STARTED',NULL,13,41.2995,40000,40000,'YANDEX','2025-07-10 10:44:04.671','2025-07-10 10:44:04.671','WORKING',NULL),(2,'STARTED',NULL,13,41.2995,40000,40000,'YANDEX','2025-07-10 10:44:59.112','2025-07-10 10:44:59.112','WORKING',NULL),(3,'STARTED',NULL,13,41.2995,40000,40000,'YANDEX','2025-07-10 10:51:26.395','2025-07-10 10:51:26.395','WORKING',NULL),(4,'STARTED',NULL,13,41.2995,40000,40000,'YANDEX','2025-07-10 10:56:37.832','2025-07-10 10:56:37.832','WORKING',NULL);
/*!40000 ALTER TABLE `order` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orderproduct`
--

DROP TABLE IF EXISTS `orderproduct`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orderproduct` (
  `id` int NOT NULL AUTO_INCREMENT,
  `count` int NOT NULL DEFAULT '1',
  `amount` int NOT NULL,
  `shop_product_id` int DEFAULT NULL,
  `order_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `OrderProduct_shop_product_id_fkey` (`shop_product_id`),
  KEY `OrderProduct_order_id_fkey` (`order_id`),
  CONSTRAINT `OrderProduct_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `order` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `OrderProduct_shop_product_id_fkey` FOREIGN KEY (`shop_product_id`) REFERENCES `shopproduct` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orderproduct`
--

LOCK TABLES `orderproduct` WRITE;
/*!40000 ALTER TABLE `orderproduct` DISABLE KEYS */;
INSERT INTO `orderproduct` VALUES (1,2,12000,1,1),(2,2,12000,1,2),(3,2,12000,1,4);
/*!40000 ALTER TABLE `orderproduct` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment`
--

DROP TABLE IF EXISTS `payment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ad_id` int DEFAULT NULL,
  `worker_id` int DEFAULT NULL,
  `shop_id` int DEFAULT NULL,
  `amount` int DEFAULT NULL,
  `start_date` datetime(3) DEFAULT NULL,
  `end_date` datetime(3) DEFAULT NULL,
  `createdt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `work_status` enum('WORKING','BLOCKED','DELETED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'WORKING',
  `type` enum('SHOP','WORKER','AD') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `Payment_ad_id_fkey` (`ad_id`),
  KEY `Payment_worker_id_fkey` (`worker_id`),
  KEY `Payment_shop_id_fkey` (`shop_id`),
  CONSTRAINT `Payment_ad_id_fkey` FOREIGN KEY (`ad_id`) REFERENCES `ad` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Payment_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `shop` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Payment_worker_id_fkey` FOREIGN KEY (`worker_id`) REFERENCES `worker` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment`
--

LOCK TABLES `payment` WRITE;
/*!40000 ALTER TABLE `payment` DISABLE KEYS */;
INSERT INTO `payment` VALUES ('0db51671-da90-48e7-b9ce-88f41ab770dc',NULL,NULL,1,540000,'2025-09-20 00:00:00.000','2025-10-20 00:00:00.000','2025-07-09 11:52:39.897','2025-07-09 12:00:01.001','WORKING','SHOP'),('3efa321b-eed8-445d-8bd1-5fdcdd41edf0',NULL,NULL,10,240000,'2025-09-20 00:00:00.000','2025-10-20 00:00:00.000','2025-07-09 11:52:53.586','2025-07-09 11:52:53.586','WORKING','SHOP'),('deb7cb12-d35a-42a0-b67f-82b041c9e649',NULL,4,NULL,240000,'2025-09-20 00:00:00.000','2025-10-20 00:00:00.000','2025-07-09 11:56:43.512','2025-07-09 11:56:43.512','WORKING','WORKER');
/*!40000 ALTER TABLE `payment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product`
--

DROP TABLE IF EXISTS `product`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `desc` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `work_status` enum('WORKING','BLOCKED','DELETED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'WORKING',
  `type` enum('COLOR','WEIGHT','LENGTH','SIZE','COUNTRY','LITR') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category_id` int DEFAULT NULL,
  `createdt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Product_category_id_fkey` (`category_id`),
  CONSTRAINT `Product_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `category` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product`
--

LOCK TABLES `product` WRITE;
/*!40000 ALTER TABLE `product` DISABLE KEYS */;
INSERT INTO `product` VALUES (1,'Bo\'yoq RUSSIAN','Bo\'yoqlar haqida izoh',NULL,'WORKING','SIZE',2,'2025-07-08 14:57:16.127','2025-07-08 15:00:45.114'),(2,'FLESH',NULL,NULL,'WORKING','LITR',3,'2025-07-10 10:30:41.010','2025-07-10 10:30:41.010');
/*!40000 ALTER TABLE `product` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `productitem`
--

DROP TABLE IF EXISTS `productitem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `productitem` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `desc` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `product_id` int DEFAULT NULL,
  `work_status` enum('WORKING','BLOCKED','DELETED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'WORKING',
  `createdt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ProductItem_product_id_fkey` (`product_id`),
  CONSTRAINT `ProductItem_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `productitem`
--

LOCK TABLES `productitem` WRITE;
/*!40000 ALTER TABLE `productitem` DISABLE KEYS */;
INSERT INTO `productitem` VALUES (1,'0.5l russian',NULL,NULL,2,'WORKING','2025-07-10 10:30:56.029','2025-07-10 10:30:56.029');
/*!40000 ALTER TABLE `productitem` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `region`
--

DROP TABLE IF EXISTS `region`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `region` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `region`
--

LOCK TABLES `region` WRITE;
/*!40000 ALTER TABLE `region` DISABLE KEYS */;
INSERT INTO `region` VALUES (2,'Chilonzor',NULL,'2025-07-08 12:15:59.472','2025-07-08 12:15:59.472');
/*!40000 ALTER TABLE `region` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `service`
--

DROP TABLE IF EXISTS `service`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `service` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `desc` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `work_status` enum('WORKING','BLOCKED','DELETED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'WORKING',
  `createdt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `service`
--

LOCK TABLES `service` WRITE;
/*!40000 ALTER TABLE `service` DISABLE KEYS */;
INSERT INTO `service` VALUES (2,'Oshpazlik',NULL,NULL,'WORKING','2025-07-08 15:10:35.221','2025-07-08 15:10:35.221');
/*!40000 ALTER TABLE `service` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shop`
--

DROP TABLE IF EXISTS `shop`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shop` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `work_status` enum('WORKING','BLOCKED','DELETED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'WORKING',
  `address` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lat` double DEFAULT NULL,
  `lon` double DEFAULT NULL,
  `delivery_amount` int DEFAULT NULL,
  `yandex_delivery` tinyint(1) NOT NULL DEFAULT '1',
  `market_delivery` tinyint(1) NOT NULL DEFAULT '1',
  `fixed_delivery` tinyint(1) NOT NULL DEFAULT '1',
  `expired` datetime(3) DEFAULT NULL,
  `region_id` int DEFAULT NULL,
  `createdt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `inn` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `Shop_region_id_fkey` (`region_id`),
  CONSTRAINT `Shop_region_id_fkey` FOREIGN KEY (`region_id`) REFERENCES `region` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shop`
--

LOCK TABLES `shop` WRITE;
/*!40000 ALTER TABLE `shop` DISABLE KEYS */;
INSERT INTO `shop` VALUES (1,'Texno market',NULL,'WORKING','Chilonzor 19, 45-dom,39-xonadon',67.03932,41.832892,40000,1,1,1,NULL,NULL,'2025-07-08 12:30:49.161','2025-07-08 12:30:49.161','31003242'),(2,'Texno market',NULL,'WORKING',NULL,NULL,NULL,NULL,1,1,1,NULL,NULL,'2025-07-08 12:32:01.413','2025-07-08 12:32:01.413',NULL),(3,'Texno market',NULL,'WORKING',NULL,NULL,NULL,NULL,1,1,1,NULL,NULL,'2025-07-08 12:32:45.997','2025-07-08 12:32:45.997',NULL),(4,'Texno market',NULL,'WORKING',NULL,NULL,NULL,NULL,1,1,1,NULL,NULL,'2025-07-08 12:32:57.428','2025-07-08 12:32:57.428',NULL),(5,'Texno market',NULL,'WORKING',NULL,NULL,NULL,NULL,1,1,1,'2025-08-31 19:00:00.000',NULL,'2025-07-08 12:43:16.262','2025-07-08 12:43:16.262',NULL),(6,'Texno market',NULL,'WORKING',NULL,NULL,NULL,NULL,1,1,1,'2025-08-31 19:00:00.000',NULL,'2025-07-08 12:48:09.654','2025-07-08 12:48:09.654',NULL),(7,'Texno market',NULL,'WORKING',NULL,NULL,NULL,NULL,1,1,1,'2025-08-31 19:00:00.000',NULL,'2025-07-08 12:50:36.243','2025-07-08 12:50:36.243',NULL),(8,'Texno market',NULL,'WORKING',NULL,NULL,NULL,NULL,1,1,1,'2025-09-01 00:00:00.000',NULL,'2025-07-08 12:52:02.094','2025-07-08 12:52:02.094',NULL),(9,'Texno market',NULL,'WORKING',NULL,NULL,NULL,NULL,1,1,1,'2025-09-01 00:00:00.000',NULL,'2025-07-08 12:52:32.933','2025-07-08 12:52:32.933',NULL),(10,'Texno market',NULL,'WORKING',NULL,NULL,NULL,NULL,1,1,1,'2025-09-01 00:00:00.000',NULL,'2025-07-08 12:57:15.673','2025-07-08 12:57:15.673','31003242'),(11,'Texno market',NULL,'WORKING',NULL,67.03932,41.832892,NULL,1,1,1,'2025-09-01 00:00:00.000',NULL,'2025-07-08 12:58:32.898','2025-07-08 12:58:32.898','31003242'),(12,'Texno market updated',NULL,'WORKING',NULL,67.03932,41.832892,NULL,1,1,1,'2025-09-01 00:00:00.000',NULL,'2025-07-08 12:59:11.836','2025-07-08 13:30:41.513','31003242'),(13,'Texno market',NULL,'WORKING',NULL,67.03932,41.832892,40000,1,1,1,'2025-09-01 00:00:00.000',NULL,'2025-07-08 13:01:00.999','2025-07-08 13:01:00.999','31003242'),(14,'Texno market',NULL,'WORKING','Chilonzor 19, 45-dom,39-xonadon',67.03932,41.832892,40000,1,1,1,'2025-09-01 00:00:00.000',NULL,'2025-07-08 13:02:06.764','2025-07-08 13:02:06.764','31003242'),(15,'Texno market',NULL,'WORKING','Chilonzor 19, 45-dom,39-xonadon',67.03932,41.832892,40000,1,1,1,'2025-09-01 00:00:00.000',2,'2025-07-08 13:26:29.530','2025-07-08 13:26:29.530','31003242');
/*!40000 ALTER TABLE `shop` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shopproduct`
--

DROP TABLE IF EXISTS `shopproduct`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shopproduct` (
  `id` int NOT NULL AUTO_INCREMENT,
  `price` int DEFAULT NULL,
  `count` int NOT NULL DEFAULT '0',
  `shop_id` int DEFAULT NULL,
  `product_item_id` int DEFAULT NULL,
  `work_status` enum('WORKING','BLOCKED','DELETED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'WORKING',
  `createdt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ShopProduct_shop_id_fkey` (`shop_id`),
  KEY `ShopProduct_product_item_id_fkey` (`product_item_id`),
  CONSTRAINT `ShopProduct_product_item_id_fkey` FOREIGN KEY (`product_item_id`) REFERENCES `productitem` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `ShopProduct_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `shop` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shopproduct`
--

LOCK TABLES `shopproduct` WRITE;
/*!40000 ALTER TABLE `shopproduct` DISABLE KEYS */;
INSERT INTO `shopproduct` VALUES (1,12000,40,13,1,'WORKING','2025-07-10 10:35:05.561','2025-07-10 10:35:05.561');
/*!40000 ALTER TABLE `shopproduct` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `super`
--

DROP TABLE IF EXISTS `super`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `super` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fullname` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('ADMIN','SUPER','USER','WORKER') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SUPER',
  `createdt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Super_phone_key` (`phone`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `super`
--

LOCK TABLES `super` WRITE;
/*!40000 ALTER TABLE `super` DISABLE KEYS */;
INSERT INTO `super` VALUES (1,'Xurshid Ismoilov',NULL,'+998950642827','00002827','SUPER','2025-07-08 10:53:03.597','2025-07-08 10:52:38.366');
/*!40000 ALTER TABLE `super` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fullname` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('ADMIN','SUPER','USER','WORKER') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'USER',
  `createdt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_phone_key` (`phone`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES (2,NULL,NULL,'+998902905770','USER','2025-07-10 10:37:00.174','2025-07-10 10:37:00.174'),(3,NULL,NULL,'+998950642827','USER','2025-09-07 20:06:32.128','2025-09-07 20:06:32.128');
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `verify`
--

DROP TABLE IF EXISTS `verify`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `verify` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `code` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expired` datetime(3) DEFAULT NULL,
  `createdt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `used` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `verify`
--

LOCK TABLES `verify` WRITE;
/*!40000 ALTER TABLE `verify` DISABLE KEYS */;
INSERT INTO `verify` VALUES ('109d482b-72a6-4bbf-b966-827c69be4e27','+998902905770','666666','2025-07-09 14:02:22.708','2025-07-09 14:00:22.709','2025-07-09 14:00:31.945',1),('15c9f7be-5c48-49d2-bb7c-c2e04d1a2750','+998902905770','666666','2025-07-09 13:30:06.333','2025-07-09 13:28:06.335','2025-07-09 13:28:16.047',1),('2303e0c3-0c2e-414f-99e9-b5049a19703b','+998950642827','666666','2025-09-07 19:59:52.053','2025-09-07 19:57:52.067','2025-09-07 19:57:52.067',0),('2e6634e4-e764-41d1-afad-aaa4b3a6c8b1','+998950642827','666666','2025-09-07 20:04:51.263','2025-09-07 20:02:51.265','2025-09-07 20:02:51.265',0),('4a9d2fe3-287e-405f-a821-141b12fd200c','+998902905770','273688','2025-07-09 13:14:00.550','2025-07-09 13:12:00.554','2025-07-09 13:12:00.554',0),('649d9367-8ac2-4359-bfa5-f85954d8d09b','+998902905770','128878','2025-07-09 13:13:24.682','2025-07-09 13:11:24.686','2025-07-09 13:11:24.686',0),('a9f8f2ab-ee40-4838-ac50-6decdbc49dd8','+998902905770','666666','2025-07-09 13:20:45.109','2025-07-09 13:18:45.112','2025-07-09 13:18:45.112',0),('bb6bd777-1456-446b-a9b6-37103146efba','+998950642827','666666','2025-09-07 20:04:47.438','2025-09-07 20:02:47.440','2025-09-07 20:02:47.440',0),('c3b0efb1-4624-401d-8a06-ffd4ba009609','+998950642827','666666','2025-09-07 20:04:49.617','2025-09-07 20:02:49.619','2025-09-07 20:02:49.619',0),('d42f80f2-35b1-4a98-a6e5-d3416f42c099','+998950642827','666666','2025-09-07 20:08:24.510','2025-09-07 20:06:24.512','2025-09-07 20:06:32.110',1),('d9d81893-31cb-4e50-a4ee-4e6e7db29955','+998902905770','666666','2025-07-10 10:38:49.849','2025-07-10 10:36:49.850','2025-07-10 10:37:00.157',1),('de57475e-3832-46d4-a19c-4c9bb3443171','+998902905770','666666','2025-07-09 13:25:21.259','2025-07-09 13:23:21.261','2025-07-09 13:23:30.952',1),('dec4e307-32af-4152-911b-1277d9bf3f19','+998950642827','666666','2025-09-07 20:02:43.705','2025-09-07 20:00:43.706','2025-09-07 20:00:43.706',0),('eee73a75-b569-4445-9c38-210fac18d5f9','+998902905770','666666','2025-07-09 13:14:51.770','2025-07-09 13:12:51.774','2025-07-09 13:12:51.774',0);
/*!40000 ALTER TABLE `verify` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `worker`
--

DROP TABLE IF EXISTS `worker`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `worker` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fullname` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `work_status` enum('WORKING','BLOCKED','DELETED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'WORKING',
  `service_id` int DEFAULT NULL,
  `expired` datetime(3) DEFAULT NULL,
  `amount` int DEFAULT NULL,
  `date_type` enum('ONCE','HOUR','DAY','MONTH') COLLATE utf8mb4_unicode_ci DEFAULT 'MONTH',
  `role` enum('ADMIN','SUPER','USER','WORKER') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'WORKER',
  `createdt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Worker_id_key` (`id`),
  UNIQUE KEY `Worker_phone_key` (`phone`),
  KEY `Worker_service_id_fkey` (`service_id`),
  CONSTRAINT `Worker_service_id_fkey` FOREIGN KEY (`service_id`) REFERENCES `service` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `worker`
--

LOCK TABLES `worker` WRITE;
/*!40000 ALTER TABLE `worker` DISABLE KEYS */;
INSERT INTO `worker` VALUES (4,'Mahmud Qosimov','+998993400128',NULL,'03552110','WORKING',2,'2025-10-01 00:00:00.000',4000000,'MONTH','WORKER','2025-07-09 11:55:52.397','2025-07-09 11:55:52.397');
/*!40000 ALTER TABLE `worker` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-17 17:08:18
