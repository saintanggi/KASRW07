import { supabase } from './lib/supabase';

export async function testConnection() {
  console.log('🔍 Testing Supabase connection...');
  
  try {
    // Test 1: Fetch roles
    const { data: roles, error: error1 } = await supabase
      .from('roles')
      .select('*');
    
    if (error1) {
      console.error('❌ Error fetching roles:', error1.message);
      return false;
    }
    console.log('✅ Roles loaded:', roles?.length, 'roles');

    // Test 2: Fetch warga
    const { data: warga, error: error2 } = await supabase
      .from('warga')
      .select('*')
      .limit(5);
    
    if (error2) {
      console.error('❌ Error fetching warga:', error2.message);
      return false;
    }
    console.log('✅ Warga loaded:', warga?.length, 'warga');

    // Test 3: Fetch penerimaan dengan relasi
    const { data: penerimaan, error: error3 } = await supabase
      .from('penerimaan')
      .select(`
        *,
        kategori:kategori_transaksi(nama_kategori),
        rekening:rekening(nama_rekening)
      `)
      .order('tanggal', { ascending: false })
      .limit(5);
    
    if (error3) {
      console.error('❌ Error fetching penerimaan:', error3.message);
      return false;
    }
    console.log('✅ Penerimaan loaded:', penerimaan?.length, 'transaksi');

    // Test 4: Fetch pengeluaran
    const { data: pengeluaran, error: error4 } = await supabase
      .from('pengeluaran')
      .select(`
        *,
        kategori:kategori_transaksi(nama_kategori)
      `)
      .order('tanggal_pengajuan', { ascending: false })
      .limit(5);
    
    if (error4) {
      console.error('❌ Error fetching pengeluaran:', error4.message);
      return false;
    }
    console.log('✅ Pengeluaran loaded:', pengeluaran?.length, 'transaksi');

    // Test 5: Fetch iuran
    const { data: iuran, error: error5 } = await supabase
      .from('iuran')
      .select(`
        *,
        warga:warga(nama, nik)
      `)
      .eq('periode', 'Des 2024')
      .limit(5);
    
    if (error5) {
      console.error('❌ Error fetching iuran:', error5.message);
      return false;
    }
    console.log('✅ Iuran loaded:', iuran?.length, 'iuran');

    // Test 6: Fetch anggaran
    const { data: anggaran, error: error6 } = await supabase
      .from('anggaran')
      .select(`
        *,
        kategori:kategori_transaksi(nama_kategori)
      `)
      .eq('tahun', 2024);
    
    if (error6) {
      console.error('❌ Error fetching anggaran:', error6.message);
      return false;
    }
    console.log('✅ Anggaran loaded:', anggaran?.length, 'pos anggaran');

    // Test 7: Fetch aset
    const { data: aset, error: error7 } = await supabase
      .from('aset')
      .select('*')
      .limit(5);
    
    if (error7) {
      console.error('❌ Error fetching aset:', error7.message);
      return false;
    }
    console.log('✅ Aset loaded:', aset?.length, 'aset');

    // Test 8: Fetch rekening
    const { data: rekening, error: error8 } = await supabase
      .from('rekening')
      .select('*');
    
    if (error8) {
      console.error('❌ Error fetching rekening:', error8.message);
      return false;
    }
    console.log('✅ Rekening loaded:', rekening?.length, 'rekening');

    // Test 9: Fetch view ringkasan RT
    const { data: ringkasanRT, error: error9 } = await supabase
      .from('v_ringkasan_rt')
      .select('*');
    
    if (error9) {
      console.error('❌ Error fetching v_ringkasan_rt:', error9.message);
      return false;
    }
    console.log('✅ Ringkasan RT loaded:', ringkasanRT?.length, 'RT');

    console.log('\n🎉 All tests passed! Database is ready to use.');
    console.log('\n📊 Summary:');
    console.log('   - Roles:', roles?.length);
    console.log('   - Warga:', warga?.length);
    console.log('   - Penerimaan:', penerimaan?.length);
    console.log('   - Pengeluaran:', pengeluaran?.length);
    console.log('   - Iuran:', iuran?.length);
    console.log('   - Anggaran:', anggaran?.length);
    console.log('   - Aset:', aset?.length);
    console.log('   - Rekening:', rekening?.length);
    console.log('   - Ringkasan RT:', ringkasanRT?.length);
    
    return true;
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

// Helper function untuk format currency
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(value);
}

// Helper function untuk fetch data dengan error handling
export async function fetchData<T>(
  tableName: string,
  options?: {
    select?: string;
    filter?: { column: string; value: any };
    order?: { column: string; ascending?: boolean };
    limit?: number;
  }
): Promise<{ data: T[] | null; error: string | null }> {
  let query = supabase.from(tableName).select(options?.select || '*');

  if (options?.filter) {
    query = query.eq(options.filter.column, options.filter.value);
  }

  if (options?.order) {
    query = query.order(options.order.column, {
      ascending: options.order.ascending ?? true
    });
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as T[], error: null };
}

// Helper function untuk insert data
export async function insertData(
  tableName: string,
  data: Record<string, any>
): Promise<{ data: any | null; error: string | null }> {
  const { data: result, error } = await supabase
    .from(tableName)
    .insert([data])
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: result, error: null };
}

// Helper function untuk update data
export async function updateData(
  tableName: string,
  id: number | string,
  data: Record<string, any>
): Promise<{ data: any | null; error: string | null }> {
  const { data: result, error } = await supabase
    .from(tableName)
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: result, error: null };
}

// Helper function untuk delete data
export async function deleteData(
  tableName: string,
  id: number | string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from(tableName)
    .delete()
    .eq('id', id);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}
