import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { extractAdWithApify } from '@/services/apify.service';
import { verifyInternalApiKey } from '@/lib/internal-auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

interface ProcessingResult {
  jobId: string;
  url: string;
  status: 'done' | 'error';
  message?: string;
}

export async function POST(request: NextRequest) {
  try {
    if (!verifyInternalApiKey(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const apifyToken = process.env.APIFY_API_TOKEN;

    if (!supabaseUrl || !supabaseServiceKey || !apifyToken) {
      return NextResponse.json(
        { error: 'Missing configuration (SUPABASE or APIFY_API_TOKEN)' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: pendingJobs, error: fetchError } = await supabase
      .from('scraping_jobs')
      .select('id, ad_url')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(5);

    if (fetchError) {
      console.error('Error fetching jobs:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch jobs', details: fetchError.message },
        { status: 500 }
      );
    }

    if (!pendingJobs || pendingJobs.length === 0) {
      return NextResponse.json({
        processed: 0,
        errors: 0,
        message: 'No pending jobs to process',
      });
    }

    const results: ProcessingResult[] = [];
    let errorCount = 0;

    for (const job of pendingJobs) {
      const now = new Date().toISOString();
      await supabase
        .from('scraping_jobs')
        .update({ status: 'running', updated_at: now })
        .eq('id', job.id);

      try {
        const extraction = await extractAdWithApify(job.ad_url, apifyToken);
        const finishedAt = new Date().toISOString();

        if (extraction.isError) {
          await supabase
            .from('scraping_jobs')
            .update({
              status: 'error',
              error_message: extraction.errorMessage ?? 'Unknown error',
              processed_at: finishedAt,
              updated_at: finishedAt,
            })
            .eq('id', job.id);

          results.push({
            jobId: job.id,
            url: job.ad_url,
            status: 'error',
            message: extraction.errorMessage,
          });
          errorCount++;
        } else {
          await supabase
            .from('scraping_jobs')
            .update({
              status: 'done',
              result: {
                originalCopy: extraction.originalCopy,
                adImageUrl: extraction.adImageUrl,
              },
              processed_at: finishedAt,
              updated_at: finishedAt,
            })
            .eq('id', job.id);

          results.push({
            jobId: job.id,
            url: job.ad_url,
            status: 'done',
          });
        }
      } catch (jobError) {
        const finishedAt = new Date().toISOString();
        const message = jobError instanceof Error ? jobError.message : String(jobError);
        console.error(`Error processing job ${job.id}:`, jobError);

        await supabase
          .from('scraping_jobs')
          .update({
            status: 'error',
            error_message: message,
            processed_at: finishedAt,
            updated_at: finishedAt,
          })
          .eq('id', job.id);

        results.push({
          jobId: job.id,
          url: job.ad_url,
          status: 'error',
          message,
        });
        errorCount++;
      }
    }

    return NextResponse.json({
      processed: results.length - errorCount,
      errors: errorCount,
      results,
    });
  } catch (error) {
    console.error('Batch scrape error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
