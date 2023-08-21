import type { ProductModel, ProductVariationModel } from "../../types/models";
import { Log } from "../../utils/log";
import { ErrorTypes } from "../../types/enums";
import { isNumber } from "../../utils/string";
import { getDatestamp } from "../../utils/date";
import { ProductRequest } from "../../types/request";
import { FileArray } from "express-fileupload";
import { getFile } from "../../utils/file";

import Database, { DatabaseModel } from "../database";
import Strings from "../../config/strings";

/**
 * Product Model
 * This model contains all the Product Information and Quantity :D
 * @author ampats04 (Jeremy Andy F. Ampatin)
 * @author mavyfaby (Maverick Fabroa)
*/
class Product extends DatabaseModel {
  private id: number;
  private name: string;
  private thumbnail?: number;
  private short_description: string;
  private description: string;
  private likes: number;
  private stock: number;
  private price: number;
  private max_quantity: number;
  private date_stamp?: string;
  private variations: ProductVariationModel[];

  /**
   * Product Public Constructor
   * @param data
   */
  public constructor(data: ProductModel) {
    super();
    this.id = data.id;
    this.name = data.name;
    this.thumbnail = data.thumbnail;
    this.short_description = data.short_description;
    this.description = data.description;
    this.likes = data.likes;
    this.stock = data.stock;
    this.max_quantity = data.max_quantity;
    this.price = data.price;
    this.date_stamp = data.date_stamp;
    this.variations = data.variations || [];
  }

  /**
   * Get Product list from the database 
   * @param callback 
   */
  public static getAll(callback: (error: ErrorTypes | null, product: Product[] | null) => void) {
    // Get database instance
    const db = Database.getInstance();

    // Query the database
    db.query('SELECT * FROM products', [], (error, results) => {
      // If has an error
      if (error) {
        Log.e(error.message);
        callback(ErrorTypes.DB_ERROR, null);
        return;
      }

      // If no results
      if (results.length === 0) {
        callback(ErrorTypes.DB_EMPTY_RESULT, null);
        return;
      }

      // Create list of products w/ variations yet
      const products: ProductModel[] = results;

      // Get all product variations
      db.query('SELECT pv.id, pv.products_id, pv.variations_id, pv.photos_id, v.name FROM product_variations pv INNER JOIN variations v ON pv.variations_id = v.id', [], (error, results) => {
        // If has error
        if (error) {
          Log.e(error.message);
          callback(ErrorTypes.DB_ERROR, null);
          return;
        }

        // Loop through the results
        for (const variation of results) {
          // Get product id
          const productId = variation.products_id;
          // Get the product index
          const productIndex = products.findIndex((product) => product.id === productId);

          // If variations array is not yet initialized
          if (!products[productIndex].variations) {
            // Initialize the variations array
            products[productIndex].variations = [];
          }

          // If product is found
          if (productIndex !== -1) {
            // Push the variation to the product
            products[productIndex].variations.push(variation);
          }
        }

        // Return the products
        callback(null, products.map((product) => new Product(product)));
      });
    });
  }

  /**
   * Get Product list from the database using the Product ID generated
   * @param id Product ID
   */
  public static fromId(id: number, callback: (error: ErrorTypes | null, product: Product | null) => void) {
    // Get database instance
    const db = Database.getInstance();
  
    //Query the database
    db.query("SELECT * FROM products WHERE id = ?", [id], (error, results) => {
      // If has an error
      if (error) {
        Log.e(error.message);
        callback(ErrorTypes.DB_ERROR, null);
        return;
      }

      // If no results
      if (results.length === 0) {
        callback(ErrorTypes.DB_EMPTY_RESULT, null);
        return;
      }

      // Get product data
      const product: ProductModel = results[0];

      // Get product variations
      db.query('SELECT pv.id, pv.products_id, pv.variations_id, pv.photos_id, v.name FROM product_variations pv INNER JOIN variations v ON pv.variations_id = v.id WHERE pv.products_id = ?', [id], (error, results) => {
        // If has error
        if (error) {
          Log.e(error.message);
          callback(ErrorTypes.DB_ERROR, null);
          return;
        }

        // Set product variations
        product.variations = results || [];
        // Return the product
        callback(null, new Product(product));
      });
    });
  }


  /**
   * Validate Product Data
   * @param data Raw product Data
   */
  public static validate(data: ProductRequest, files?: FileArray | null) {
    // If name is empty
    if (!data.name) return [Strings.PRODUCT_EMPTY_NAME, "name"];
    // If Short Description is empty
    if (!data.short_description) return [Strings.PRODUCT_EMPTY_SHORT_DESCRIPTION, "short_description"];
    // If Short Description exceeds 128 characters
    if (data.short_description.length > 128) return [Strings.PRODUCT_LIMIT_SHORT_DESCRIPTION, "short_description"];
    // If Description is empty
    if (!data.description) return [Strings.PRODUCT_EMPTY_DESCRIPTION, 'description'];
    // If Price is empty
    if (!data.price) return [Strings.PRODUCT_EMPTY_PRICE, 'price'];
    // If Price is not in correct format
    if (!isNumber(data.price)) return [Strings.PRODUCT_INVALID_PRICE, "price"];
    // If Price is less than 0
    if (data.price < 0) return [Strings.PRODUCT_LIMIT_PRICE, "price"];
    // If Stock is empty
    if (!data.stock) return [Strings.PRODUCT_EMPTY_STOCK, "stock"];
    // If Stock is not in correct format
    if (!isNumber(data.stock)) return [Strings.PRODUCT_INVALID_STOCK, "stock"];
    // If Stock is less than 0
    if (data.stock < 0) return [Strings.PRODUCT_LIMIT_STOCK, "stock"];
    // If max quantity is not in correct format
    if (!isNumber(data.max_quantity)) return [Strings.PRODUCT_INVALID_MAX_QUANTITY, "max_quantity"];
    // If max_quantity is less than 0
    if (data.max_quantity < 0) return [Strings.PRODUCT_LIMIT_MAX_QUANTITY, "max_quantity"];
    // If Thumbnail is empty
    if (!data.thumbnail) return [Strings.PRODUCT_EMPTY_THUMBNAIL, "thumbnail"];
    // If Thumbnail is not in correct format
    if (!isNumber(data.thumbnail)) return [Strings.PRODUCT_INVALID_THUMBNAIL, "thumbnail"];

    // If has variations
    if (data.variations && data.variations.length > 0) {
      // If files is empty
      if (!files || (Array.isArray(files) && files.length === 0)) return [Strings.PRODUCT_EMPTY_VARIATIONS, "variations"];

      // For every variation
      for (const variation of data.variations.split(',').filter(v => v.length > 0)) {
        // Get photo file
        const photo = files[`variations_${variation}`];

        // If variation photo not found
        if (!photo) return [Strings.PRODUCT_EMPTY_VARIATION_FILE.replace("{id}", variation), `variations_${variation}`];

        // If photo is an empty array
        if (Array.isArray(photo) && photo.length === 0) {
          return [Strings.PRODUCT_EMPTY_VARIATION_FILE.replace("{id}", variation), `variations_${variation}`];
        }
      }
    }
  }

  /**
   * Insert product data to the database
   * @param product Product Data
   * @param callback Callback Function
   */
  public static insert(product: ProductRequest, files: FileArray | null | undefined, callback: (error: ErrorTypes | null) => void) {
    // Get the current date
    const datestamp = getDatestamp();

    // Get database connection
    Database.getConnection((error, conn) => {
      if (error) {
        Log.e(error.message);
        callback(ErrorTypes.DB_ERROR);
      }

      // Begin transaction
      conn.beginTransaction(error => {
        // If has an error
        if (error) {
          Log.e(error.message);
          callback(ErrorTypes.DB_ERROR);
          return;
        }

        // Query the Database
        conn.query("INSERT INTO products (name, thumbnail, short_description, description, likes, stock, price, max_quantity, date_stamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [
          product.name,
          product.thumbnail,
          product.short_description,
          product.description,
          0, // Default likes to 0
          product.stock,
          product.price,
          product.max_quantity,
          datestamp
        ], (error, results) => {
          // If has an error
          if (error) {
            callback(ErrorTypes.DB_ERROR);
            return;
          }
  
          // New product ID
          const productId = results.insertId;
  
          // If the product has variations
          if (product.variations && files) {
            // For every variation
            for (const v of product.variations.split(",").filter(v => v.length > 0)) {
              // Get photo
              const photo = getFile(files, `variations_${v}`);
  
              // If photo is not found
              if (!photo) {
                // Rollback the transaction
                conn.rollback(error => {
                  if (error) Log.e(error.message);
                  callback(ErrorTypes.DB_ERROR);
                });
                
                return;
              }
  
              // Insert variation photo
              conn.query("INSERT INTO photos (type, data, date_stamp) VALUES (?, ?, ?)", [photo.mimetype, photo.data, datestamp], (error, results) => {
                // If has an error
                if (error) {
                  // Rollback the transaction
                  conn.rollback(error => {
                    if (error) Log.e(error.message);
                    callback(ErrorTypes.DB_ERROR);
                  });
                  
                  return;
                }
  
                // Insert product variation
                conn.query("INSERT INTO product_variations (products_id, variations_id, photos_id) VALUES (?, ?, ?)", [productId, v, results.insertId], (error) => {
                  // If has an error
                  if (error) {
                    // Rollback the transaction
                    conn.rollback(error => {
                      if (error) Log.e(error.message);
                      callback(ErrorTypes.DB_ERROR);
                    });
                    
                    return;
                  }
                });
  
                // Commit the transaction
                conn.commit((error) => {
                  // If has an error
                  if (error) {
                    Log.e(error.message);
                    callback(ErrorTypes.DB_ERROR);
                    return;
                  }
  
                  // Return the product
                  callback(null);
                });
              });
            }
  
            return;
          }
  
          // Commit transaction and return the product w/ no variations
          conn.commit((error) => {
            // If has an error
            if (error) {
              Log.e(error.message);
              callback(ErrorTypes.DB_ERROR);
              return;
            }
  
            // Return the product
            callback(null);
          });
        });
      });
    });
  }

  /**
   * Get primary key ID
   */
  public getId() {
    return this.id;
  }

  /**
   * Get name
   */
  public getName() {
    return this.name;
  }

  /**
   * Get Thumbnail 
   */
  public getThumbnail() {
    return this.thumbnail;
  }

  /**
   * Get Short Description
   */
  public getShortDescription() {
    return this.short_description;
  }

  /**
   * Get Description
   */
  public getDescription() {
    return this.description;
  }

  /**
   * Get Likes
   */
  public getLikes() {
    return this.likes;
  }

  /**
   * Get Stock
   */
  public getStock() {
    return this.stock;
  }

  /**
   * Get max quantity
   */
  public getMaxQuantity() {
    return this.max_quantity;
  }

  /**
   * Get Price
   */
  public getPrice() {
    return this.price;
  }

  /**
   * Get Date stamp
   */
  public getDatestamp() {
    return this.date_stamp;
  }

  /**
   * Get Variations
   */
  public getVariations(): ProductVariationModel[] {
    return this.variations;
  }
}

export default Product;