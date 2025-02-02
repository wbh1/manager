import { APIError, ResourcePage } from '@linode/api-v4/lib/types';
import { OBJECT_STORAGE_DELIMITER as delimiter } from 'src/constants';
import { useInfiniteQuery, useMutation, useQuery } from 'react-query';
import { queryClient, queryPresets } from './base';
import { getAll } from 'src/utilities/getAll';
import {
  createBucket,
  deleteBucket,
  getBuckets,
  getClusters,
  getObjectList,
  getObjectStorageKeys,
  ObjectStorageBucket,
  ObjectStorageBucketRequestPayload,
  ObjectStorageCluster,
  ObjectStorageKey,
  ObjectStorageObjectListResponse,
  getBucketsInCluster,
} from '@linode/api-v4/lib/object-storage';

export interface BucketError {
  cluster: ObjectStorageCluster;
  error: APIError[];
}

interface BucketsResponce {
  buckets: ObjectStorageBucket[];
  errors: BucketError[];
}

export const queryKey = 'object-stroage';

/**
 * This getAll is probably overkill for getting all
 * Object Storage clusters (currently there are only 4),
 * but lets use it to be safe.
 */
export const getAllObjectStorageClusters = () =>
  getAll<ObjectStorageCluster>(() => getClusters())().then((data) => data.data);

export const getAllObjectStorageBuckets = () =>
  getAll<ObjectStorageBucket>(() => getBuckets())().then((data) => data.data);

export const useObjectStorageClusters = (enabled: boolean = true) =>
  useQuery<ObjectStorageCluster[], APIError[]>(
    `${queryKey}-clusters`,
    getAllObjectStorageClusters,
    { ...queryPresets.oneTimeFetch, enabled }
  );

export const useObjectStorageBuckets = (
  clusters: ObjectStorageCluster[] | undefined,
  enabled: boolean = true
) =>
  useQuery<BucketsResponce, APIError[]>(
    `${queryKey}-buckets`,
    // Ideally we would use the line below, but if a cluster is down, the buckets on that
    // cluster don't show up in the responce. We choose to fetch buckets per-cluster so
    // we can tell the user which clusters are having issues.
    // getAllObjectStorageBuckets,
    () => getAllBucketsFromClusters(clusters!),
    {
      ...queryPresets.longLived,
      enabled: clusters !== undefined && enabled,
      retry: false,
    }
  );

export const useObjectStorageAccessKeys = (params: any) =>
  useQuery<ResourcePage<ObjectStorageKey>, APIError[]>(
    [`${queryKey}-access-keys`, params],
    () => getObjectStorageKeys(params),
    { keepPreviousData: true }
  );

export const useCreateBucketMutation = () => {
  return useMutation<
    ObjectStorageBucket,
    APIError[],
    ObjectStorageBucketRequestPayload
  >(createBucket, {
    onSuccess: (newEntity) => {
      queryClient.setQueryData<BucketsResponce>(
        `${queryKey}-buckets`,
        (oldData) => ({
          buckets: [...(oldData?.buckets || []), newEntity],
          errors: oldData?.errors || [],
        })
      );
    },
  });
};

export const useDeleteBucketMutation = () => {
  return useMutation<{}, APIError[], { cluster: string; label: string }>(
    (data) => deleteBucket(data),
    {
      onSuccess: (_, variables) => {
        queryClient.setQueryData<BucketsResponce>(
          `${queryKey}-buckets`,
          (oldData) => {
            return {
              buckets:
                oldData?.buckets.filter(
                  (bucket: ObjectStorageBucket) =>
                    !(
                      bucket.cluster === variables.cluster &&
                      bucket.label === variables.label
                    )
                ) || [],
              errors: oldData?.errors || [],
            };
          }
        );
      },
    }
  );
};

export const useObjectBucketDetailsInfiniteQuery = (
  cluster: string,
  bucket: string,
  prefix: string
) =>
  useInfiniteQuery<ObjectStorageObjectListResponse, APIError[]>(
    [queryKey, cluster, bucket, prefix],
    ({ pageParam }) =>
      getObjectList(cluster, bucket, { marker: pageParam, delimiter, prefix }),
    {
      getNextPageParam: (lastPage) => lastPage.next_marker,
    }
  );

export const getAllBucketsFromClusters = async (
  clusters: ObjectStorageCluster[]
) => {
  const promises = clusters.map((cluster) =>
    getAll<ObjectStorageBucket>((params) =>
      getBucketsInCluster(cluster.id, params)
    )()
      .then((data) => data.data)
      .catch((error) => ({
        error,
        cluster,
      }))
  );

  const data = await Promise.all(promises);

  const bucketsPerCluster = data.filter((item) =>
    Array.isArray(item)
  ) as ObjectStorageBucket[][];

  const buckets = bucketsPerCluster.reduce((acc, val) => acc.concat(val), []);

  const errors = data.filter((item) => !Array.isArray(item)) as BucketError[];

  if (errors.length === clusters.length) {
    throw new Error('Unable to get Object Storage buckets.');
  }

  return { buckets, errors } as BucketsResponce;
};
