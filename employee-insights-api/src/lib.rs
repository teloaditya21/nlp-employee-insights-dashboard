use worker::*;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
struct InsightSummary {
    id: i32,
    word_insight: String,
    total_count: i32,
    positif_count: i32,
    negatif_count: i32,
    netral_count: i32,
    positif_percentage: f64,
    negatif_percentage: f64,
    netral_percentage: f64,
    created_at: String,
}

#[derive(Serialize)]
struct ApiResponse<T> {
    success: bool,
    data: T,
    message: String,
}

#[derive(Serialize)]
struct DashboardStats {
    total_insights: i32,
    total_feedback: i32,
    positive_ratio: f64,
    negative_ratio: f64,
    neutral_ratio: f64,
    top_positive_insights: Vec<InsightSummary>,
    top_negative_insights: Vec<InsightSummary>,
    all_insights: Vec<InsightSummary>,
}

fn log_request(req: &Request) {
    console_log!("New request: {} {}", req.method().to_string(), req.url()?.as_str());
}

#[event(fetch)]
pub async fn main(req: Request, env: Env, _ctx: Context) -> Result<Response> {
    console_error_panic_hook::set_once();
    
    // Enable CORS for all origins
    let cors = Cors::new()
        .with_origins(vec!["*"])
        .with_methods(vec![Method::Get, Method::Post, Method::Options])
        .with_headers(vec!["*"]);

    Router::new()
        .get_async("/api/insights/summary", get_insights_summary)
        .get_async("/api/insights/dashboard", get_dashboard_stats)
        .get_async("/api/insights/top-positive", get_top_positive)
        .get_async("/api/insights/top-negative", get_top_negative)
        .get_async("/api/insights/:word", get_insight_by_word)
        .get("/", |_, _| Response::ok("Employee Insights API v1.0 - Powered by Rust & Cloudflare Workers"))
        .run(req, env)
        .await
}

async fn get_insights_summary(_req: Request, env: Env) -> Result<Response> {
    let d1 = env.d1("DB")?;
    
    let statement = d1.prepare("SELECT id, wordInsight as word_insight, total_count, positif_count, negatif_count, netral_count, positif_percentage, negatif_percentage, netral_percentage, created_at FROM insight_summary ORDER BY total_count DESC");
    
    let result = statement.all().await?;
    let insights: Vec<InsightSummary> = result.results()?;
    
    let response = ApiResponse {
        success: true,
        data: insights,
        message: "Successfully retrieved all insights summary".to_string(),
    };
    
    Response::from_json(&response)
}

async fn get_dashboard_stats(_req: Request, env: Env) -> Result<Response> {
    let d1 = env.d1("DB")?;
    
    // Get total counts
    let total_insights_stmt = d1.prepare("SELECT COUNT(*) as count FROM insight_summary");
    let total_insights_result = total_insights_stmt.first::<serde_json::Value>(None).await?;
    let total_insights = total_insights_result
        .unwrap()
        .get("count")
        .unwrap()
        .as_i64()
        .unwrap() as i32;
    
    // Get total feedback count
    let total_feedback_stmt = d1.prepare("SELECT SUM(total_count) as total FROM insight_summary");
    let total_feedback_result = total_feedback_stmt.first::<serde_json::Value>(None).await?;
    let total_feedback = total_feedback_result
        .unwrap()
        .get("total")
        .unwrap()
        .as_i64()
        .unwrap() as i32;
    
    // Get overall sentiment ratio
    let sentiment_stmt = d1.prepare("SELECT SUM(positif_count) as pos, SUM(negatif_count) as neg, SUM(netral_count) as neu FROM insight_summary");
    let sentiment_result = sentiment_stmt.first::<serde_json::Value>(None).await?;
    let sentiment_data = sentiment_result.unwrap();
    
    let total_pos = sentiment_data.get("pos").unwrap().as_i64().unwrap() as f64;
    let total_neg = sentiment_data.get("neg").unwrap().as_i64().unwrap() as f64;
    let total_neu = sentiment_data.get("neu").unwrap().as_i64().unwrap() as f64;
    let total_all = total_pos + total_neg + total_neu;
    
    let positive_ratio = (total_pos / total_all * 100.0 * 100.0).round() / 100.0;
    let negative_ratio = (total_neg / total_all * 100.0 * 100.0).round() / 100.0;
    let neutral_ratio = (total_neu / total_all * 100.0 * 100.0).round() / 100.0;
    
    // Get top positive insights
    let top_positive_stmt = d1.prepare("SELECT id, wordInsight as word_insight, total_count, positif_count, negatif_count, netral_count, positif_percentage, negatif_percentage, netral_percentage, created_at FROM insight_summary WHERE positif_percentage > 70 ORDER BY positif_percentage DESC, total_count DESC LIMIT 5");
    let top_positive_result = top_positive_stmt.all().await?;
    let top_positive_insights: Vec<InsightSummary> = top_positive_result.results()?;
    
    // Get top negative insights
    let top_negative_stmt = d1.prepare("SELECT id, wordInsight as word_insight, total_count, positif_count, negatif_count, netral_count, positif_percentage, negatif_percentage, netral_percentage, created_at FROM insight_summary WHERE negatif_percentage > 70 ORDER BY negatif_percentage DESC, total_count DESC LIMIT 5");
    let top_negative_result = top_negative_stmt.all().await?;
    let top_negative_insights: Vec<InsightSummary> = top_negative_result.results()?;
    
    // Get all insights for charts
    let all_insights_stmt = d1.prepare("SELECT id, wordInsight as word_insight, total_count, positif_count, negatif_count, netral_count, positif_percentage, negatif_percentage, netral_percentage, created_at FROM insight_summary ORDER BY total_count DESC LIMIT 20");
    let all_insights_result = all_insights_stmt.all().await?;
    let all_insights: Vec<InsightSummary> = all_insights_result.results()?;
    
    let dashboard_stats = DashboardStats {
        total_insights,
        total_feedback,
        positive_ratio,
        negative_ratio,
        neutral_ratio,
        top_positive_insights,
        top_negative_insights,
        all_insights,
    };
    
    let response = ApiResponse {
        success: true,
        data: dashboard_stats,
        message: "Successfully retrieved dashboard statistics".to_string(),
    };
    
    Response::from_json(&response)
}

async fn get_top_positive(_req: Request, env: Env) -> Result<Response> {
    let d1 = env.d1("DB")?;
    
    let statement = d1.prepare("SELECT id, wordInsight as word_insight, total_count, positif_count, negatif_count, netral_count, positif_percentage, negatif_percentage, netral_percentage, created_at FROM insight_summary WHERE positif_percentage > 70 ORDER BY positif_percentage DESC, total_count DESC LIMIT 10");
    
    let result = statement.all().await?;
    let insights: Vec<InsightSummary> = result.results()?;
    
    let response = ApiResponse {
        success: true,
        data: insights,
        message: "Successfully retrieved top positive insights".to_string(),
    };
    
    Response::from_json(&response)
}

async fn get_top_negative(_req: Request, env: Env) -> Result<Response> {
    let d1 = env.d1("DB")?;
    
    let statement = d1.prepare("SELECT id, wordInsight as word_insight, total_count, positif_count, negatif_count, netral_count, positif_percentage, negatif_percentage, netral_percentage, created_at FROM insight_summary WHERE negatif_percentage > 70 ORDER BY negatif_percentage DESC, total_count DESC LIMIT 10");
    
    let result = statement.all().await?;
    let insights: Vec<InsightSummary> = result.results()?;
    
    let response = ApiResponse {
        success: true,
        data: insights,
        message: "Successfully retrieved top negative insights".to_string(),
    };
    
    Response::from_json(&response)
}

async fn get_insight_by_word(req: Request, env: Env) -> Result<Response> {
    let d1 = env.d1("DB")?;
    
    // Extract word from URL path
    if let Some(word) = req.param("word") {
        let statement = d1.prepare("SELECT id, wordInsight as word_insight, total_count, positif_count, negatif_count, netral_count, positif_percentage, negatif_percentage, netral_percentage, created_at FROM insight_summary WHERE wordInsight LIKE ?1 ORDER BY total_count DESC");
        
        let search_term = format!("%{}%", word);
        let result = statement.bind(&[search_term.into()])?.all().await?;
        let insights: Vec<InsightSummary> = result.results()?;
        
        let response = ApiResponse {
            success: true,
            data: insights,
            message: format!("Successfully retrieved insights for '{}'", word),
        };
        
        Response::from_json(&response)
    } else {
        let response = ApiResponse {
            success: false,
            data: Vec::<InsightSummary>::new(),
            message: "Word parameter is required".to_string(),
        };
        
        Response::from_json(&response)?.with_status(400)
    }
} 